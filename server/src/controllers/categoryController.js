// Import the Category model
import asyncHandler from 'express-async-handler'
import Category from '../models/categoryModel.js'
import slugify from 'slugify'

function categoriesList (categories, parentId = null) {
  const categoryList = []
  let category
  if (parentId == null) {
    category = categories.filter((cat) => cat.parentId == undefined)
  } else {
    category = categories.filter((cat) => cat.parentId == parentId)
  }

  for (const cate of category) {
    categoryList.push({
      _id: cate._id,
      name: cate.name,
      slug: cate.slug,
      parentId: cate.parentId,
      children: categoriesList(categories, cate._id)
    })
  }

  return categoryList
}

// Define the controller functions
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).exec()
  if (categories) {
    const categoryList = categoriesList(categories)
    res.status(200).json({ categoryList })
  } else {
    return res.status(400).json({ error: 'Không tìm thấy!!!' })
  }
})

// Create a new category
const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body
  const cateObj = { name, slug: slugify(name) }
  if (!cateObj.name) {
    res.status(401).json({ message: 'Tên danh mục không được trống!!!' })
  }
  const existingCategory = await Category.findOne({ name: cateObj.name })
  if (existingCategory) {
    res.status(201).send({
      success: true,
      message: 'Tên danh mục đã tồn tại!!!'
    })
  }
  if (req.body.parentId) {
    cateObj.parentId = req.body.parentId
  }
  const newCategory = await Category.create(cateObj)
  res.status(201).json({
    success: Boolean(newCategory),
    data: newCategory || 'Lỗi!!!'
  })
})
// Find category by Id
const getCategoryByName = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
    res.status(200).send({
      success: true,
      message: 'Successfully',
      category
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      success: false,
      error,
      message: 'Error While getting Single Category'
    })
  }
}

const updateCategoryById = asyncHandler(async (req, res) => {
  const { _id } = req.params
  const { name, parentId, type } = req.body
  const updatedCategories = []
  if (name instanceof Array) {
    for (let i = 0; i < name.length; i++) {
      const category = {
        name: name[i],
        type: type[i]
      }
      if (parentId[i] !== '') {
        category.parentId = parentId[i]
      }

      const updatedCategory = await Category.findOneAndUpdate(
        { _id: _id[i] },
        category,
        { new: true }
      )
      console.log(updatedCategory)
      updatedCategories.push(updatedCategory)
    }
    return res.status(201).json({ updateCategories: updatedCategories })
  } else {
    const category = req.body
    if (name) {
      category.slug = slugify(name)
    }
    if (parentId !== '') {
      category.parentId = parentId
    }
    const updatedCategory = await Category.findOneAndUpdate({ _id }, category, {
      new: true
    })
    console.log(updatedCategory)
    return res.status(201).json({ updatedCategory })
  }
})

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params
  const cate = await Category.findByIdAndDelete(id)

  return res.status(200).json({
    success: Boolean(cate),
    data: 'Xóa danh mục thành công.'
  })
})

export {
  createCategory,
  getAllCategories,
  getCategoryByName,
  updateCategoryById,
  deleteCategory
}
