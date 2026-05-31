export default function Bar({ value, day }) {
    return (
      <div className="flex flex-col items-center gap-3 h-full justify-end">
        <div
          className="w-12 rounded-t-xl bg-gradient-to-t from-blue-700 to-sky-400"
          style={{ height: value }}
        ></div>
  
        <span>{day}</span>
      </div>
    );
  }