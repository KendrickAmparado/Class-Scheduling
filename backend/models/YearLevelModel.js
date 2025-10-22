import mongoose from 'mongoose';

const YearLevelSchema = new mongoose.Schema({
  course: { type: String, required: true },
  subtitle: { type: String, required: true },
  year: { type: String, required: true },
}, {
  collection: 'year-levels'  // explicitly match the collection name in MongoDB
});

export default mongoose.model('YearLevel', YearLevelSchema);
