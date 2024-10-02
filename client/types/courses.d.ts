type ImageType = {
  url: string;
};

type User = {
  _id: string;
  name: string;
  email: string;
  phone: number;
  password: string; // Note: You might not need this on the frontend for security reasons
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  passwordResetToken?: string; // Optional
  passwordResetTokenExpire?: Date; // Optional
};

type CommentType = {
  video: React.JSX.Element;
  images: any;
  question: ReactNode;
  vimeoVideoId: string;
  videoLink: any;
  _id: string;
  questionText?: string; // This should be the text of the question
  questionImage?: ImageType; // This should be an object with a URL
  answerText?: string; // This should be the text of the answer
  answerImage?: ImageType; // This should be an object with a URL
  questionReplies: CommentType[]; // Replies to the question
  videoUrl: string;
};

type ReviewType = {
  user: User;
  rating?: number;
  comment: string;
  commentReplies?: ReviewType[];
};

type LinkType = {
  title: string;
  url: string;
};

type CourseDataType = {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: LinkType[];
  suggestion: string;
  questions: CommentType[];
  videoLink?: string; // Add new fields here
  videoId?: string; // Add new fields here
};

type BenefitType = {
  title: string;
};

type PrerequisiteType = {
  title: string;
};

type YearType = {
  _id: string;
  year: number;
  subjects: SubjectType[];
};

type SubjectType = {
  _id: string;
  name: string;
  questions: CommentType[];
};

type CoursesType = {
  _id: string;
  name: string;
  description: string;
  categories: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: {
    public_id: string;
    url: string;
  };
  tags: string;
  level: string;
  demoUrl: string;
  benefits: BenefitType[];
  prerequisites: PrerequisiteType[];
  reviews: ReviewType[];
  courseData: CourseDataType[];
  ratings?: number;
  purchased: number;
  years: YearType[];
};
