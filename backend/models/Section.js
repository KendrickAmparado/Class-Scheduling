import mongoose from 'mongoose';


const sectionSchema = new mongoose.Schema({
  course: { type: String, required: true },
  year: { type: String, required: true },
  name: { type: String, required: true },
  archived: { type: Boolean, default: false },
});

const Section = mongoose.model('Section', sectionSchema);
export default Section;
