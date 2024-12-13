'use client'

import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from 'react'

type R2Image = {
  key: string
  uploaded: string
}

const imageLoader = ({ src }: { src: string }) => {
  return `/api/image?key=${src}`;
}

export default function Images() {
  const [images, setImages] = useState<R2Image[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [imagesPerPage] = useState(9)

  useEffect(() => {
    const fetchImages = async () => {
      const currentUrl = new URL(window.location.href)
      const data = await fetch(`${currentUrl.origin}/api/images`)
      const imageData = await data.json<R2Image[]>()
      setImages(imageData)
      console.log(imageData)
    }

    fetchImages()
  }, [])

  const filteredImages = images.filter(image => image.key.toLowerCase().includes(searchQuery.toLowerCase()))

  const indexOfLastImage = currentPage * imagesPerPage
  const indexOfFirstImage = indexOfLastImage - imagesPerPage
  const currentImages = filteredImages.slice(indexOfFirstImage, indexOfLastImage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <div className="min-h-screen block md:flex">
      <div className="w-full block md:flex flex-col md:h-screen">
        <div className="p-4 bg-white space-y-2">
          <h1 className="text-2xl font-bold">List Images</h1>
          <h2 className="text-lg mb-8">
            Powered by <a href="https://developers.cloudflare.com/workers-ai" className="text-blue-500 hover:underline">Cloudflare Workers AI</a>.
            Source code available on <a href="https://github.com/kristianfreeman/workers-ai-image-playground" className="text-blue-500 hover:underline">GitHub</a>.
          </h2>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded"
          />

          {!currentImages || !currentImages.length && <span>No images yet.</span>}

          <div className="grid grid-cols-3 gap-2 max-w-screen-lg">
            {currentImages.map(image => (
              <div className="space-y-2" key={image.key}>
                <Image loader={imageLoader} src={image.key} width={256} height={256} alt={image.key} />
                <p className="text-sm truncate">
                  {image.key}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center space-x-2">
            {Array.from({ length: Math.ceil(filteredImages.length / imagesPerPage) }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => paginate(index + 1)}
                className={`px-4 py-2 border rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <p>
            <Button asChild>
              <Link href="/">Back to Image Generator</Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
