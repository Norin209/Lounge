import Image from 'next/image';
import Link from 'next/link';
import styles from '../_pages/public-pages.module.css';

export default function PageIntro({ eyebrow, title, accent, description, image, imageAlt }: { eyebrow: string; title: string; accent: string; description: string; image?: string; imageAlt?: string }) {
  return <section className={`${styles.intro} ${image ? styles.introWithImage : styles.introCompact}`}>
    <div className={styles.introCopy}><nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{eyebrow}</span></nav><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}<br /><em>{accent}</em></h1><p className={styles.introDescription}>{description}</p></div>
    {image && <div className={styles.introImage}><Image src={image} alt={imageAlt || ''} fill priority sizes="(max-width: 760px) 100vw, 40vw" /></div>}
  </section>;
}
