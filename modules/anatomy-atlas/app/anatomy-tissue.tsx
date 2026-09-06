'use client';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

/** Authored diagrammatic surface treatment. Hatching is NOT muscle-fibre data. */
export function AnatomyTissue({
  geometry,
  color,
  selected,
  ghost,
  muscle,
  illustrated,
  outline,
}: {
  geometry: THREE.BufferGeometry;
  color: string;
  selected: boolean;
  ghost: boolean;
  muscle: boolean;
  illustrated: boolean;
  outline: boolean;
}) {
  const { material, contour } = useMemo(() => {
    geometry.computeBoundingBox();
    const size = geometry.boundingBox!.getSize(new THREE.Vector3()),
      center = geometry.boundingBox!.getCenter(new THREE.Vector3());
    const axis =
      size.x > size.y && size.x > size.z ? 0 : size.z > size.y ? 2 : 1;
    const scale = Math.max(size.getComponent(axis), 0.01),
      width = Math.max(size.getComponent(axis === 0 ? 1 : 0), 0.01);
    const m = new THREE.MeshStandardMaterial({
      color: selected ? '#e3bb78' : color,
      roughness: 0.92,
      metalness: 0,
      side: THREE.DoubleSide,
      transparent: ghost,
      opacity: ghost ? 0.055 : 1,
      depthWrite: !ghost,
      emissive: selected ? '#503112' : '#000000',
      emissiveIntensity: 0.13,
    });
    if (illustrated && muscle && !ghost)
      m.onBeforeCompile = (shader) => {
        shader.uniforms.diagramCenter = { value: center };
        shader.uniforms.diagramAlong = {
          value: new THREE.Vector3().setComponent(axis, 1),
        };
        shader.uniforms.diagramAcross = {
          value: new THREE.Vector3().setComponent(axis === 0 ? 1 : 0, 1),
        };
        shader.uniforms.diagramScale = {
          value: new THREE.Vector2(width, scale),
        };
        shader.vertexShader =
          'varying vec3 vDiagramPosition;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvDiagramPosition = position;',
        );
        shader.fragmentShader =
          'varying vec3 vDiagramPosition; uniform vec3 diagramCenter; uniform vec3 diagramAlong; uniform vec3 diagramAcross; uniform vec2 diagramScale;\n' +
          shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
        float crossSurface=dot(vDiagramPosition-diagramCenter,diagramAcross)/diagramScale.x;
        float alongSurface=dot(vDiagramPosition-diagramCenter,diagramAlong)/diagramScale.y;
        float stripe=crossSurface*110.0+sin(alongSurface*4.0)*1.8;
        float ink=1.0-smoothstep(0.12,0.12+max(fwidth(stripe)*0.7,0.1),abs(sin(stripe)));
        diffuseColor.rgb*=1.0-ink*0.13;
      `,
        );
      };
    m.customProgramCacheKey = () =>
      `diagram-v1-${illustrated}-${muscle}-${ghost}`;
    const c = new THREE.MeshBasicMaterial({
      color: selected ? '#8a6330' : muscle ? '#713f37' : '#746b54',
      side: THREE.BackSide,
    });
    const thickness = Math.min(0.008, Math.max(0.0005, size.length() * 0.001));
    c.onBeforeCompile = (shader) => {
      shader.uniforms.diagramThickness = { value: thickness };
      shader.vertexShader =
        'uniform float diagramThickness;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\ntransformed += normal * diagramThickness;',
      );
    };
    c.customProgramCacheKey = () => 'diagram-contour-v1';
    return { material: m, contour: c };
  }, [geometry, color, selected, ghost, muscle, illustrated]);
  useEffect(
    () => () => {
      material.dispose();
      contour.dispose();
    },
    [material, contour],
  );
  return (
    <>
      <mesh
        geometry={geometry}
        material={material}
        raycast={ghost ? () => null : undefined}
      />
      {illustrated && outline && !ghost && (
        <mesh geometry={geometry} material={contour} raycast={() => null} />
      )}
    </>
  );
}
