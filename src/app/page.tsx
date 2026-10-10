import Link from "next/link";

const FEATURES = [
  { href: "/market-research", title: "Market Research", owner: "C1", ready: false },
  { href: "/video-prediction", title: "Video Prediction", owner: "C2", ready: false },
  { href: "/knowledge-assistant", title: "Knowledge Assistant", owner: "C3", ready: true },
  { href: "/analytics", title: "Analytics", owner: "C4", ready: false },
];

export default function Home() {
  return (
    <div className="home">
      <h1>Creator Research Platform</h1>
      <div className="grid">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href} className="tile">
            <strong>{f.title}</strong>
            <span>
              {f.owner} · {f.ready ? "available" : "coming soon"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
