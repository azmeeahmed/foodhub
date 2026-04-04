import '../styles/globals.css';

export const metadata = {
  title: 'Places Explorer',
  description: 'Discover places with an interactive map synchronized to a live Google Sheet.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
