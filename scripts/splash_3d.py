"""Offscreen rendering of licensed anatomical meshes for the splash films.

The shaders light existing mesh geometry, not procedurally invented anatomy.
Render-time dependencies and meshes stay outside the website checkout.
"""
from pathlib import Path
import math
import sys
import numpy as np
from PIL import Image

WORK = Path(__file__).resolve().parents[2] / 'work' / 'cinematic-splash'
sys.path.insert(0, str(WORK / 'motion-runtime'))
import moderngl


def subdivide(points, polygons):
    """Catmull–Clark surface subdivision of the supplied quad mesh."""
    face_points = np.asarray([points[face].mean(axis=0) for face in polygons])
    edges, vertex_faces = {}, [[] for _ in points]
    for fi, face in enumerate(polygons):
        for i, p in enumerate(face):
            vertex_faces[p].append(fi)
            key = tuple(sorted((p, face[(i + 1) % len(face)])))
            edges.setdefault(key, []).append(fi)
    edge_ids, edge_points = {}, []
    edge_sums, counts = np.zeros_like(points), np.zeros(len(points))
    for key, neighbors in edges.items():
        a, b = key
        middle = (points[a] + points[b]) / 2
        edge_sums[a] += middle
        edge_sums[b] += middle
        counts[a] += 1
        counts[b] += 1
        edge_ids[key] = len(points) + len(edge_points)
        edge_points.append((points[a] + points[b] + face_points[neighbors].sum(axis=0)) / (2 + len(neighbors)))
    adjusted = points.copy()
    for p, neighbors in enumerate(vertex_faces):
        n = counts[p]
        if n >= 3:
            adjusted[p] = (face_points[neighbors].mean(axis=0) + 2 * edge_sums[p] / n + (n - 3) * points[p]) / n
    face_offset = len(points) + len(edge_points)
    new_faces = []
    for fi, face in enumerate(polygons):
        for i, p in enumerate(face):
            after = edge_ids[tuple(sorted((p, face[(i + 1) % len(face)])))]
            before = edge_ids[tuple(sorted((p, face[i - 1])))]
            new_faces.append([p, after, face_offset + fi, before])
    return np.concatenate((adjusted, edge_points, face_points)), new_faces


def obj_mesh(path, group=None):
    positions, uvs, normals, faces = [], [], [], []
    current = None
    polygons = []
    for line in Path(path).read_text().splitlines():
        parts = line.split()
        if not parts:
            continue
        if parts[0] == 'o':
            current = parts[1]
        elif parts[0] == 'v':
            positions.append([float(x) for x in parts[1:4]])
        elif parts[0] == 'vt':
            uvs.append([float(x) for x in parts[1:3]])
        elif parts[0] == 'vn':
            normals.append([float(x) for x in parts[1:4]])
        elif parts[0] == 'f' and (group is None or current == group):
            face = []
            for item in parts[1:]:
                split = item.split('/')
                face.append((int(split[0]) - 1,
                             int(split[1]) - 1 if len(split) > 1 and split[1] else -1,
                             int(split[2]) - 1 if len(split) > 2 and split[2] else -1))
            polygons.append([v[0] for v in face])
            for i in range(1, len(face) - 1):
                faces.append((face[0], face[i], face[i + 1]))
    points = np.asarray(positions, dtype='f4')
    if group == 'brain':
        used = sorted({p for face in polygons for p in face})
        remap = {p: i for i, p in enumerate(used)}
        points = points[used]
        polygons = [[remap[p] for p in face] for face in polygons]
        for _ in range(2):
            points, polygons = subdivide(points, polygons)
        faces = []
        for face in polygons:
            for i in range(1, len(face) - 1):
                faces.append([(p, -1, -1) for p in (face[0], face[i], face[i + 1])])
    ids = np.asarray([[v[0] for v in face] for face in faces])
    selected = points[np.unique(ids)]
    center = (selected.min(axis=0) + selected.max(axis=0)) / 2
    points = (points - center) * (2 / np.ptp(selected, axis=0).max())
    averaged = np.zeros_like(points)
    a, b, c = points[ids[:, 0]], points[ids[:, 1]], points[ids[:, 2]]
    face_normals = np.cross(b - a, c - a)
    for i in range(3):
        np.add.at(averaged, ids[:, i], face_normals)
    averaged /= np.maximum(np.linalg.norm(averaged, axis=1, keepdims=True), 1e-8)
    packed = []
    for face in faces:
        for p, uv, n in face:
            normal = normals[n] if n >= 0 and group != 'brain' else averaged[p]
            tex = uvs[uv] if uv >= 0 else (0, 0)
            packed.append([*points[p], *normal, *tex])
    return np.asarray(packed, dtype='f4')


VERTEX = '''
#version 330
in vec3 in_position;
in vec3 in_normal;
in vec2 in_uv;
uniform mat4 model;
uniform mat4 mvp;
out vec3 position;
out vec3 normal;
out vec2 uv;
void main() {
    position = (model * vec4(in_position, 1.0)).xyz;
    normal = mat3(model) * in_normal;
    uv = in_uv;
    gl_Position = mvp * vec4(in_position, 1.0);
}
'''

FRAGMENT = '''
#version 330
in vec3 position;
in vec3 normal;
in vec2 uv;
uniform sampler2D albedo;
uniform sampler2D normal_map;
uniform sampler2D occlusion;
uniform bool textured;
uniform vec3 eye;
uniform float light;
uniform float cut;
out vec4 color;
void main() {
    if (position.x > cut) discard;
    vec3 n = normalize(normal);
    float ao = 1.0;
    vec3 base = vec3(.64, .73, .75);
    if (textured) {
        vec3 q1 = dFdx(position), q2 = dFdy(position);
        vec2 t1 = dFdx(uv), t2 = dFdy(uv);
        vec3 tangent = normalize(q1 * t2.y - q2 * t1.y);
        vec3 bitangent = -normalize(cross(n, tangent));
        vec3 detail = texture(normal_map, uv).xyz * 2.0 - 1.0;
        n = normalize(mat3(tangent, bitangent, n) * detail);
        vec3 original = texture(albedo, uv).rgb;
        float gray = dot(original, vec3(.2126, .7152, .0722));
        base = mix(vec3(.38, .45, .47), vec3(.85, .90, .90), gray);
        ao = texture(occlusion, uv).r;
    }
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(eye - position);
    vec3 key = normalize(vec3(-2.0, 2.1, 2.0));
    vec3 rim = normalize(vec3(1.8, .5, -1.5));
    vec3 fill = normalize(vec3(1.2, -.5, 2.0));
    float diffuse = max(dot(n, key), 0.0);
    float edge = pow(max(dot(n, rim), 0.0), 1.5);
    float frontal = max(dot(n, fill), 0.0);
    float spec = pow(max(dot(n, normalize(key + v)), 0.0), 70.0);
    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    vec3 lit = base * (.055 + diffuse * .9 + frontal * .12) * mix(.35, 1.0, ao);
    lit += vec3(.11, .65, .58) * edge * .6;
    lit += vec3(.8, .9, 1.0) * spec * .3;
    lit += vec3(.04, .20, .19) * fresnel * .15;
    lit *= light;
    lit = pow(lit, vec3(.85));
    color = vec4(lit, 1.0);
}
'''


class AnatomyRenderer:
    def __init__(self, width=1920, height=1080):
        self.width, self.height = width, height
        self.ctx = moderngl.create_standalone_context()
        self.program = self.ctx.program(vertex_shader=VERTEX, fragment_shader=FRAGMENT)
        self.target = self.ctx.simple_framebuffer((width, height), components=4)
        self.ctx.enable(moderngl.DEPTH_TEST)
        self.ctx.disable(moderngl.CULL_FACE)
        self.meshes = {}
        self.textures = []
        brain_path = WORK / 'new-assets/drummyfish-brain-skull-head.obj'
        skull_root = WORK / 'new-assets/cdmir-skull/skull-obj'
        for name, path, group in [('brain', brain_path, 'brain'), ('skull', skull_root / 'skull-Low4K.obj', None)]:
            data = obj_mesh(path, group)
            buffer = self.ctx.buffer(data.tobytes())
            self.meshes[name] = self.ctx.vertex_array(self.program, [(buffer, '3f 3f 2f', 'in_position', 'in_normal', 'in_uv')])
        for slot, (filename, uniform) in enumerate([
            ('Skull-Low.png', 'albedo'), ('Skull-Low-normal.png', 'normal_map'), ('Skull-AO.png', 'occlusion')]):
            img = Image.open(skull_root / filename).convert('RGB').transpose(Image.Transpose.FLIP_TOP_BOTTOM)
            texture = self.ctx.texture(img.size, 3, img.tobytes())
            texture.build_mipmaps()
            texture.filter = (moderngl.LINEAR_MIPMAP_LINEAR, moderngl.LINEAR)
            texture.use(slot)
            self.program[uniform].value = slot
            self.textures.append(texture)

    def render(self, name='brain', yaw=0, pitch=0, roll=0, distance=4.3, light=1.0, cut=4):
        def rotation(axis, angle):
            c, s = math.cos(angle), math.sin(angle)
            m = np.eye(4, dtype='f4')
            a, b = ((1, 2), (0, 2), (0, 1))[axis]
            m[a, a] = m[b, b] = c
            m[a, b], m[b, a] = -s, s
            return m
        model = rotation(2, roll) @ rotation(1, yaw) @ rotation(0, pitch)
        view = np.eye(4, dtype='f4')
        view[2, 3] = -distance
        f = 1 / math.tan(math.radians(30) / 2)
        projection = np.zeros((4, 4), dtype='f4')
        projection[0, 0], projection[1, 1] = f / (self.width / self.height), f
        near, far = .1, 50
        projection[2, 2] = (far + near) / (near - far)
        projection[2, 3] = 2 * far * near / (near - far)
        projection[3, 2] = -1
        self.program['model'].write(model.T.tobytes())
        self.program['mvp'].write((projection @ view @ model).T.tobytes())
        self.program['eye'].value = (0., 0., distance)
        self.program['light'].value = light
        self.program['cut'].value = cut
        self.program['textured'].value = name == 'skull'
        self.target.use()
        self.target.clear(0, 0, 0, 0)
        self.meshes[name].render()
        return Image.frombytes('RGBA', (self.width, self.height), self.target.read(components=4)).transpose(Image.Transpose.FLIP_TOP_BOTTOM)


if __name__ == '__main__':
    renderer = AnatomyRenderer()
    for name in ('brain', 'skull'):
        renderer.render(name, yaw=.4).save(WORK / f'{name}-3d-test.png')
