// @eg      housing=true&select=name,location.city&sort=-name,location.state

import { NextFunction, Request, Response } from 'express'

// ?averageCost[lte]=10000
const advancedResults =
	(model: any, populate: [] = []) =>
	async (req: Request, res: Response, next: NextFunction) => {
		let query

		const reqQuery = { ...req.query }

		const removeFields = ['select', 'sort', 'page', 'limit']
		removeFields.forEach((param) => delete reqQuery[param])

		let queryStr = JSON.stringify(reqQuery)
		queryStr = queryStr.replace(
			/\b(gt|gte|lt|lte|in)\b/g,
			(match) => `$${match}`
		)

		query = model.find(JSON.parse(queryStr))

		if (req.query.select) {
			const fields = (req.query.select as string).split(',').join(' ')
			query = query.select(fields)
		}

		if (req.query.sort) {
			const sortBy = (req.query.sort as string).split(',').join(' ')
			query = query.sort(sortBy)
		} else {
			query = query.sort({ createdAt: -1 })
			// '-createdAt'
		}

		// Pagination
		const page = parseInt(req.query.page as string, 10) || 1
		const limit = parseInt(req.query.limit as string, 10) || 20
		const startIndex = (page - 1) * limit
		const endIndex = page * limit
		const total = await model.countDocuments()
		const totalPage = Math.ceil(total / limit)

		query = query.skip(startIndex).limit(limit)

		if (populate) {
			query = query.populate(populate)
		}

		const results = await query

		// Pagination result
		const pagination = { next: {}, prev: {} }

		if (endIndex < total) {
			pagination.next = {
				page: page + 1,
				limit,
			}
		}

		if (startIndex > 0) {
			pagination.prev = {
				page: page - 1,
				limit,
			}
		}

		res.advancedResults = {
			success: true,
			count: results.length,
			totalPage,
			pagination,
			data: results,
		}
		next()
	}

export default advancedResults
