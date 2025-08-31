export default function CollapsedError({ error }: { error: any }) {
  let errorMessage: string = "Unknown error";
  if (!!error) {
    if (typeof error === 'string') {
      errorMessage = error;
    }
    else if (typeof error.message === 'string') {
      errorMessage = error.message;
    }
  }

  return (
    <div className="collapse collapse-arrow bg-error border-base-300 border grid-cols-[100%]">
      <input type="checkbox" />
      <div className="collapse-title font-semibold">
        Error <span className="text-xs">(click to expand)</span>
      </div>
      <div className="collapse-content text-sm">
        <div className="max-w-full wrap-break-word">
          {errorMessage}
        </div>
      </div>
    </div>
  );
}