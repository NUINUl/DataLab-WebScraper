import DataLabApp from '@/components/DataLabApp'

/**
 * Root page — renders the DataLab scraping console.
 * This is a Server Component that delegates all interactivity
 * to the 'use client' DataLabApp shell.
 */
export default function HomePage() {
  return <DataLabApp />
  console.log(
    "%c NUINUI %c SYSTEM ARCHITECT %c v1.0 ",
    "background: #00f0ff; color: #000; font-weight: bold; border-radius: 3px 0 0 3px; padding: 2px 5px;",
    "background: #000; color: #00f0ff; font-weight: bold; padding: 2px 5px; border: 1px solid #00f0ff;",
    "background: #333; color: #fff; border-radius: 0 3px 3px 0; padding: 2px 5px;"
  );
  console.log("%c > Access Granted. DataLab Core is online. ", "color: #00f0ff; font-family: monospace;");
}
