declare module 'jpeg-js' {
  type DecodedImage = {
    data: Uint8Array;
    width: number;
    height: number;
  };

  type EncodedImage = {
    data: Uint8Array;
    width: number;
    height: number;
  };

  const jpeg: {
    decode(input: Uint8Array, options?: { useTArray?: boolean; formatAsRGBA?: boolean }): DecodedImage;
    encode(image: { data: Uint8Array; width: number; height: number }, quality?: number): EncodedImage;
  };

  export default jpeg;
}