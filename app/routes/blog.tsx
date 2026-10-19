import {redirect} from 'react-router';
import {SCIENCE_BLOG_PATH} from '~/data/editorial';
export function loader() {
  return redirect(SCIENCE_BLOG_PATH, 301);
}
