import "./globals.css";

export const metadata = {
  title: "Whiskey Log",
  description: "A personal log of whiskeys tried, with notes and ratings.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
