'use client';

import { usePathname, useRouter } from 'next/navigation';

// Every "Get started" / "Try for free" button calls handleSignIn. The hero on the
// home page is the sign-in / sign-up form, so on the home page this scrolls up and
// focuses the email field; from any other page it goes to the home page.
export function useAuthAction() {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignIn = () => {
    if (pathname !== '/') {
      router.push('/');
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Wait for the smooth scroll before focusing, so the browser doesn't jump.
    setTimeout(() => document.getElementById('hero-email')?.focus({ preventScroll: true }), 450);
  };

  return { handleSignIn };
}
