export default function TableRow({ subject, date, status, percent }) {
    return (
      <tr className="border-t hover:bg-gray-50">
  
        <td className="p-4 font-medium">
          {subject}
        </td>
  
        <td className="p-4 text-gray-500">
          {date}
        </td>
  
        <td className="p-4">
  
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
            {status}
          </span>
        </td>
  
        <td className="p-4">
          {percent}
        </td>
      </tr>
    );
  }
  