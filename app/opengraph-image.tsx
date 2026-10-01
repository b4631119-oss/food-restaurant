import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Sushi Bar №1 · Суши и роллы · Ош";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = await readFile(join(process.cwd(), "public/images/favicon.jpg"), "base64");
const logoSrc = `data:image/jpeg;base64,${logoData}`;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0A1424 0%, #0D1B30 100%)",
          color: "#D4AF37",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <img
          src={logoSrc}
          alt=""
          width={330}
          height={330}
          style={{ borderRadius: "50%", border: "3px solid #D4AF37", objectFit: "cover" }}
        />
        <div style={{ display: "flex", marginTop: 32, fontSize: 38, fontWeight: 700 }}>
          Sushi Bar №1 · Суши и роллы · Ош
        </div>
      </div>
    ),
    size,
  );
}
