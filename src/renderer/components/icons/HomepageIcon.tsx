import * as React from 'react'
import icon from '@/static/icon.png'

function HomepageIcon(props: React.ComponentProps<'img'>) {
  return <img src={icon} alt="Wamo Chat" {...props} />
}

const MemoHomepageIcon = React.memo(HomepageIcon)
export default MemoHomepageIcon
