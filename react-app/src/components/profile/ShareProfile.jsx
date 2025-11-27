import { motion } from 'framer-motion'
import { Share2, Twitter, Linkedin, Facebook, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import toast from 'react-hot-toast'

/**
 * ShareProfile - Social media sharing component
 * 
 * Allows users to share their quiz profile achievements on social media platforms
 * or copy a shareable profile link.
 */
export default function ShareProfile({ user, userProfile }) {
  // Generate main site URL
  const siteUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : ''

  // Create share message with stats
  const getShareMessage = () => {
    if (!userProfile?.XP) return 'Check out QuizLab - Master DevOps with AI-powered quizzes!'
    
    return `I just reached ${userProfile.XP} XP on QuizLab! ` +
           `Level: ${userProfile.levelName || 'Novice'} | ` +
           `Avg Score: ${userProfile.averageScore || 'N/A'} | ` +
           `Best: ${userProfile.bestCategory || 'Getting Started'}`
  }

  const handleShareTwitter = () => {
    console.log('Twitter share clicked', { userProfile, siteUrl })
    const message = getShareMessage()
    const text = encodeURIComponent(`${message}\n\n${siteUrl}`)
    const url = `https://twitter.com/intent/tweet?text=${text}`
    console.log('Opening Twitter URL:', url)
    window.open(url, '_blank', 'noopener,noreferrer,width=550,height=420')
  }

  const handleShareLinkedIn = () => {
    console.log('LinkedIn share clicked', { siteUrl })
    const url = encodeURIComponent(siteUrl)
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    console.log('Opening LinkedIn URL:', linkedInUrl)
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=550,height=420')
  }

  const handleShareFacebook = () => {
    console.log('Facebook share clicked', { siteUrl })
    const url = encodeURIComponent(siteUrl)
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
    console.log('Opening Facebook URL:', fbUrl)
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=550,height=420')
  }

  const handleCopyLink = async () => {
    console.log('Copy link clicked')
    try {
      const message = getShareMessage()
      const fullText = `${message}\n\n${siteUrl}`
      console.log('Copying text:', fullText)
      await navigator.clipboard.writeText(fullText)
      toast.success('Share message copied to clipboard!', {
        icon: '🔗',
        duration: 2000,
      })
    } catch (err) {
      console.error('Copy failed:', err)
      toast.error('Failed to copy link')
    }
  }

  return (
    <Card className="profile-card share-profile-card">
      <CardHeader>
        <CardTitle className="share-profile-title">
          <Share2 className="share-profile-icon" size={24} />
          Share Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="share-profile-description">
          Share your quiz achievements and learning journey with friends and colleagues!
        </p>
        <div className="share-profile-buttons">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="share-button share-button-twitter"
              onClick={handleShareTwitter}
            >
              <Twitter size={18} />
              Twitter
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="share-button share-button-linkedin"
              onClick={handleShareLinkedIn}
            >
              <Linkedin size={18} />
              LinkedIn
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="share-button share-button-facebook"
              onClick={handleShareFacebook}
            >
              <Facebook size={18} />
              Facebook
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="share-button share-button-copy"
              onClick={handleCopyLink}
            >
              <LinkIcon size={18} />
              Copy Link
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
