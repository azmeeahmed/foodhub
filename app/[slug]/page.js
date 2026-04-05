import { notFound } from 'next/navigation';
import { getListingBySlug, LISTINGS } from '../../lib/listings';
import ListingPage from '../../components/ListingPage';

export function generateStaticParams() {
  return LISTINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) return {};
  return {
    title:       `${listing.title} | FoodHub`,
    description: listing.subtitle,
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);
  if (!listing) notFound();
  return <ListingPage listing={listing} />;
}