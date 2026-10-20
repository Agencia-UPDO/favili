import { IBlogPost } from '@/interface';
import getMarkDownData from '@/utils/getMarkDownData';
import BlogList from './BlogList';

const BlogListWrapper = () => {
  // Fetch all blogs from markdown files (server-side)
  const allBlogs = getMarkDownData<IBlogPost & { [key: string]: unknown }>('src/data/blogs');

  return <BlogList blogs={allBlogs} />;
};
BlogListWrapper.displayName = 'BlogListWrapper';
export default BlogListWrapper;
