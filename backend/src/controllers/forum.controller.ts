import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// @desc    Get all forum posts
// @route   GET /api/forum
export const getPosts = async (req: any, res: Response) => {
  try {
    const posts = await prisma.forumPost.findMany({
      include: {
        author: {
          select: { name: true, role: true, avatarUrl: true }
        },
        likes: true, // To check if current user liked
        comments: {
             include: {
                 author: { select: { name: true, role: true } },
                 shop: { select: { id: true, name: true, verified: true } }
             },
             orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform for frontend
    const formattedPosts = posts.map(post => ({
      id: post.id,
      author: post.author.name,
      authorRole: post.author.role,
      title: post.title,
      content: post.content,
      likes: post._count.likes,
      likeBytes: post.likes.some(l => l.userId === req.user?.id), // Check if user liked
      comments: post.comments.map(c => ({
        id: c.id,
        author: c.author.name,
        role: c.author.role,
        content: c.content,
        date: c.createdAt,
        shopId: c.shop?.id
      })),
      tags: post.tags ? JSON.parse(JSON.stringify(post.tags)) : [],
      createdAt: post.createdAt,
      viewCount: post.viewCount || 0
    }));

    res.json(formattedPosts);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new post
// @route   POST /api/forum
export const createPost = async (req: any, res: Response) => {
  try {
    const { title, content, tags } = req.body;

    const post = await prisma.forumPost.create({
      data: {
        userId: req.user.id,
        title,
        content,
        tags: tags || [],
        viewCount: 0,
        likeCount: 0,
        commentCount: 0
      },
      include: {
          author: { select: { name: true, role: true } }
      }
    });

    res.status(201).json(post);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle like on a post
// @route   POST /api/forum/:id/like
export const toggleLike = async (req: any, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      });
      await prisma.forumPost.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } }
      });
      res.json({ liked: false });
    } else {
      // Like
      await prisma.postLike.create({
        data: {
          postId,
          userId
        }
      });
      await prisma.forumPost.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } }
      });
      res.json({ liked: true });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a comment
// @route   POST /api/forum/:id/comments
export const addComment = async (req: any, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = req.user.id;

    // Check if user has a shop to link
    const shop = await prisma.shop.findUnique({ where: { userId } });

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        shopId: shop?.id, // Link shop if author is a shop owner
        content
      },
      include: {
          author: { select: { name: true, role: true } },
          shop: { select: { id: true, name: true, verified: true } }
      }
    });
    
    // Update comment count
    await prisma.forumPost.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } }
    });

    res.status(201).json({
        id: comment.id,
        author: comment.author.name,
        role: comment.author.role,
        content: comment.content,
        date: comment.createdAt,
        shopId: comment.shop?.id
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
