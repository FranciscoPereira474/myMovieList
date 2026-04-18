import { Montserrat } from 'next/font/google';
import "./globals.css";
import Navbar from "./components/Navbar/Navbar";

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400','500','700'],
  variable: '--font-montserrat',
});

export default function RootLayout({ children,}: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <body className={montserrat.variable}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
