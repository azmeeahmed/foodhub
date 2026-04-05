import '../styles/globals.css';

export const metadata = {
  title:       'FoodHub Maps',
  description: 'Curated local guides with interactive maps.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}