'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

export default function StoreImage({ src, onError, ...props }: ImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps['src'] | null>(null);
  return <Image {...props} src={failedSource === src ? '/images/treatment-fallback.webp' : src} onError={event => {
    setFailedSource(src);
    onError?.(event);
  }} />;
}
