import Image from 'next/image';
import styles from '../_pages/modern-homepage.module.css';

export default function BrandLogo({ light = false, priority = false }: { light?: boolean; priority?: boolean }) {
  return <span className={styles.brandLogo}><Image src={light ? '/logo.png' : '/logo-black.png'} alt="Premier Lounge" width={4861} height={6250} sizes="(max-width: 760px) 230px, 325px" priority={priority} className={styles.brandLogoImage} /></span>;
}
