'use client';

import { usePathname } from 'next/navigation';

export function TawkToManager() {
  const pathname = usePathname();
  const allowedPaths = ['/contact', '/help'];
  const shouldShow = allowedPaths.includes(pathname);

  if (!shouldShow) {
    return null;
  }

  return (
    <script
      id="tawk-to-script"
      type="text/javascript"
      dangerouslySetInnerHTML={{
        __html: `
            var Tawk_API=Tawk_API||{};
            if(window.innerWidth < 768){Tawk_API.customStyle={visibility:{mobile:{position:'br',yOffset:90}}}};
            var Tawk_LoadStart=new Date();
            (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/69bf2d332273861c39a78f91/1jk9ch58q';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
            })();
        `,
      }}
    />
  );
}
