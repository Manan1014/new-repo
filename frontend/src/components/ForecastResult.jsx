export default function ForecastResult({ result }) {
  if (!result) return null;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mt-4">
      <h2 className="text-lg font-semibold mb-2">📈 Forecast Result</h2>
      <ul className="list-disc pl-4">
        {result.forecast.map((f, i) => (
          <li key={i}>
            {f.month}: <strong>{f.sales}</strong>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-gray-700">💡 {result.insight}</p>
      <p className="mt-1 italic text-gray-500">{result.aiInsight}</p>
    </div>
  );
}
