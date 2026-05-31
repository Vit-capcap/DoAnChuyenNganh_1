import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Home() {

    const navigate = useNavigate()

    const [students, setStudents] = useState([])

    useEffect(() => {

        axios.get('http://127.0.0.1:5000/students')
            .then((res) => {
                setStudents(res.data)
            })

    }, [])

    return (

        <div className='min-h-screen bg-gray-100 p-10'>

            <div className='flex justify-between mb-6'>

                <h1 className='text-3xl font-bold'>
                    Danh sách sinh viên
                </h1>

                <button
                    className='bg-green-500 text-white px-5 py-2 rounded'
                    onClick={() => navigate('/blank')}
                >
                    Sang Page Trắng
                </button>

            </div>

            {
                students.map((student) => (

                    <div
                        key={student.id}
                        className='bg-white p-5 rounded-xl shadow mb-4'
                    >

                        <h2 className='text-xl font-bold'>
                            {student.name}
                        </h2>

                        <p>Email: {student.email}</p>

                        <p>SĐT: {student.phone}</p>

                    </div>
                ))
            }

        </div>
    )
}

export default Home