import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement Blob/File#arrayBuffer() (used by src/lib/stl.ts
// to read an uploaded .stl) — real browsers all support it. Polyfill it
// via FileReader, which jsdom does implement, so tests can exercise that
// code path.
if (typeof Blob !== "undefined" && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function arrayBuffer(): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
