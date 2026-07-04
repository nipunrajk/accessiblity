import { Theme } from '@radix-ui/themes';
import { ReactNode } from 'react';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <Theme appearance="dark" accentColor="teal" grayColor="sand" radius="small" scaling="100%">
      {children}
    </Theme>
  );
}
