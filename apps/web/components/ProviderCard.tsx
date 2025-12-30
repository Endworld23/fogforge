type ProviderCardProps = {
  name: string;
  city: string;
  state: string;
};

export default function ProviderCard({ name, city, state }: ProviderCardProps) {
  return (
    <article>
      <h3>{name}</h3>
      <p>
        {city}, {state}
      </p>
    </article>
  );
}
