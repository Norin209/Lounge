import Image from 'next/image';
import styles from '../_pages/modern-homepage.module.css';

export default function BrandLogo({ light = false, priority = false }: { light?: boolean; priority?: boolean }) {
  return <span className={styles.brandLogo}><Image src={light ? '/brand/logo-light.webp' : '/brand/logo-dark.webp'} alt="Premier Lounge" width={368} height={272} sizes="(max-width: 760px) 82px, 122px" priority={priority} className={styles.brandLogoImage} /></span>;
}
