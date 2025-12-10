import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPageManifest } from "@/api/pages";
import { pillarPages } from "@/config/pageManifest";

const PageCard = ({ title, summary, path }) => (
  <Link
    to={path}
    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
  >
    <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
      Pillar
    </div>
    <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-600">{summary}</p>
    <div className="mt-3 inline-flex items-center text-sm font-medium text-blue-600">
      Open pillar
      <span className="ml-2">→</span>
    </div>
  </Link>
);

export default function Pillars() {
  const [pages, setPages] = useState(pillarPages);

  useEffect(() => {
    let isMounted = true;

    getPageManifest()
      .then((response) => {
        if (!isMounted) return;
        if (Array.isArray(response?.pillars) && response.pillars.length) {
          setPages(response.pillars);
        }
      })
      .catch(() => {
        // fall back silently to static manifest
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          NorthStar Pillars
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Explore the 8 pillars
        </h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Start with the pillar that matters most today. Each area combines AI
          guidance, habits, and tracking so you can make measurable progress
          without overwhelm.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <PageCard key={page.id} {...page} />
        ))}
      </div>
    </div>
  );
}
