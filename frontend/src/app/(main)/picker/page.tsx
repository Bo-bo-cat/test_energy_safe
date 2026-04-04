// app/(main)/picker/page.tsx
type Props = {
  searchParams: Promise<{ hasUps?: string }>;
};

export default async function PickerPage({ searchParams }: Props) {
  const params = await searchParams;
  const hasUps = params.hasUps === 'true';

  return (
    <div>
      <h1>Підбір системи</h1>

      {hasUps ? (
        <div>
          <input placeholder="Знайти ДБЖ" />
        </div>
      ) : (
        <div>
          <div>Модель-ДБЖ 1</div>
          <div>Модель-ДБЖ 2</div>
          <div>Модель-ДБЖ 3</div>
        </div>
      )}
    </div>
  );
}