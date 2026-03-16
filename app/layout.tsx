import type {Metadata} from 'next';
import { Inter, Kalam } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const kalam = Kalam({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-hand' });

export const metadata: Metadata = {
  title: 'ProBoard - Sticky Notes',
  description: 'Professional Corkboard Workspace',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${kalam.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
