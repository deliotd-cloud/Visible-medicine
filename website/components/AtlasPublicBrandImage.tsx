/** The generated Atlas brand uses only these two public, unoptimized lockups. */
type AtlasPublicBrandImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  unoptimized: true;
};

export default function AtlasPublicBrandImage({
  src,
  alt,
  width,
  height,
  unoptimized,
}: AtlasPublicBrandImageProps) {
  if (
    !unoptimized ||
    !['/brand/visible-medicine-lockup-dark.png', '/brand/visible-medicine-lockup-light.png'].includes(src) ||
    alt !== 'Visible Medicine by Elivion' ||
    width !== 1005 ||
    height !== 202
  ) {
    throw new Error('Unsupported generated Atlas brand image props');
  }

  const light = src.endsWith('-light.png');
  const publicSrc = src.replace('/brand/', '/brand/approved/');
  return <img src={publicSrc} alt={alt} width={1024} height={light ? 217 : 205} loading="lazy" decoding="async" data-nimg="1" />;
}
