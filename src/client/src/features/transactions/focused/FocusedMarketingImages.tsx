import { Box } from '@mui/material'
import { useEffect, useState } from 'react'

const marketingImages = [
  'https://www.shva.co.il/wp-content/uploads/2023/03/canon-might-be-animated.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/ashrait.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/%D7%94%D7%95%D7%A8%D7%90%D7%AA.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/top.png',
  'https://www.shva.co.il/wp-content/uploads/2023/06/clp.png',
]

export function FocusedMarketingImages() {
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % marketingImages.length)
    }, 3500)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <Box
      sx={{
        height: 280,
        position: 'relative',
        width: '100%',
      }}
    >
      {marketingImages.map((image, index) => (
        <Box
          alt=""
          component="img"
          key={image}
          src={image}
          sx={{
            display: 'block',
            inset: 0,
            maxHeight: 280,
            maxWidth: '100%',
            objectFit: 'contain',
            opacity: index === imageIndex ? 1 : 0,
            position: 'absolute',
            transition: 'opacity 650ms ease-in-out',
            width: '100%',
          }}
        />
      ))}
    </Box>
  )
}
