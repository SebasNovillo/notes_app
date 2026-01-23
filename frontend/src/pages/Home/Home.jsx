import React from 'react'
import Navbar from '../../components/Navbar/Navbar'
import NoteCard from '../../components/Cards/NoteCard'

const Home = () => {
  return (
    <>
      <Navbar />

      <div className='container mx-auto'>
        <NoteCard />
      </div>
    </>
  )
}

export default Home