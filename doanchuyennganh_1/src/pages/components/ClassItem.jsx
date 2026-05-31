export default function ClassItem({ time, subject, room }) {
    return (
      <div className="flex gap-4 items-center">
  
        <div className="bg-blue-100 text-blue-700 rounded-xl p-3 min-w-[70px] text-center">
          <h3 className="font-bold">
            {time}
          </h3>
        </div>
  
        <div>
          <h4 className="font-semibold">
            {subject}
          </h4>
  
          <p className="text-gray-500 text-sm">
            {room}
          </p>
        </div>
      </div>
    );
}