import type { Metadata } from "next";
import Link from "next/link";
import report from "./report.json";
import styles from "./paper.module.css";

export const metadata: Metadata = {
  title: "Personalized BCI for mental health | Ravia",
  description: "An evidence-led research report on EEG generalization, longitudinal stability, anxiety measurement, and rapid personalization."
};

function Inline({ text }: { text: string }) {
  return text.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    return link ? <a key={index} href={link[2]}>{link[1]}</a> : part;
  });
}

export default function PersonalizationOfBciPage() {
  return (
    <main className={styles.paper}>
      <article aria-labelledby="personalization-title">
        <header className={styles.intro}>
          <Link href="/papers/">← Papers</Link>
          <h1 id="personalization-title">Personalized BCI<br />for mental health</h1>
        </header>
        <p className={styles.date}>{report[0].text}</p>
        <p><Link href="/papers/personalization-of-bci/research-1-bci-personalized/">Open Research #1 - BCI personalized →</Link></p>
        <nav className={styles.contents} aria-label="Article contents">
          <h2>In this report</h2>
          <ol>{report.filter(block => block.kind === "h2").map(block => (
            <li key={block.id}><a href={`#${block.id}`}>{block.text}</a></li>
          ))}</ol>
        </nav>
        {report.slice(1).map((block, index) => {
          if (block.kind === "h2") return <h2 id={block.id} key={index}>{block.text}</h2>;
          if (block.kind === "h3") return <h3 key={index}>{block.text}</h3>;
          if (block.kind === "list") return <ul key={index}>{block.items?.map((item, i) => <li key={i}><Inline text={item} /></li>)}</ul>;
          return <p key={index}><Inline text={block.text ?? ""} /></p>;
        })}
        <footer className={styles.footer}><Link href="/papers/">← Back to Papers</Link></footer>
      </article>
    </main>
  );
}
