import Image from "next/image";

export default function Page() {
  return (
    <main style={{ margin:0, background:"#111", height:"100vh" }}>
      <iframe
        src="/wall.html"
        style={{ border:"none", width:"100%", height:"100%" }}
      />
    </main>
  );
}