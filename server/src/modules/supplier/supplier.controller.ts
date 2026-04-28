import type { Response } from "express";
import type { AuthenticatedRequest } from "../../shared/middleware/authMiddleware.js";
import { prisma } from "../../config/prisma.js";
import handleError from "../../shared/utils/error.js";
import { logActivity } from "../../shared/utils/logger.js";
import { sendNotification } from "../../shared/utils/notification.js";
import { getIO } from "../../config/socket.js";
import { deleteFileIfExists } from "../../shared/utils/fileCleanup.js";

export const supplierController = {
  uploadDocument: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { documentType } = req.body;

      const [document] = await prisma.$transaction([
        prisma.supplierDocument.create({
          data: {
            supplierId: userId!,
            documentType: documentType || "BUSINESS_LICENSE",
            fileName: file.originalname,
            filePath: file.path,
          },
        }),
        prisma.supplier.update({
          where: { id: userId },
          data: { status: "PENDING" },
        }),
      ]);

      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
        select: { id: true },
      });
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      // --- NOTIFICATION LOGIC ---
      await Promise.all([
        sendNotification({
          userId: userId!,
          type: "DOCUMENT_UPLOADED",
          content: `Your ${document.documentType} was uploaded. Status: PENDING review.`,
          room: userId,
        }),

        ...admins.map((admin) => {
          sendNotification({
            userId: admin.id,
            type: "VERIFICATION_REQUEST",
            content: `New document upload from Supplier: ${user?.firstName} ${user?.lastName}`,
            link: `/dashboard/admin/users/${userId}`,
            room: admin.id,
          });
        }),

        logActivity(
          `Document uploaded: ${document.documentType}`,
          "INFO",
          userId,
          "Supplier.uploadDocument",
          undefined,
          true, // Record as user action
        ),
      ]);

      return res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        data: document,
      });
    } catch (error) {
      handleError("POST /supplier/upload", error, res);
    }
  },

  updateProfile: async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("Upload request:", {
        file: req.file,
        body: req.body,
        userId: req.user?.id,
        headers: req.headers["content-type"],
      });
      const userId = req.user?.id!;
      const io = getIO();
      const {
        phone,
        address,
        taxId,
        registrationNumber,
        yearsInBusiness,
        categories,
        bio,
      } = req.body;

      const toNull = <T>(value: T | undefined): T | null => {
        return value !== undefined ? value : null;
      };

      const updatedSupplier = await prisma.supplier.update({
        where: { id: userId },
        data: {
          phone: toNull(phone),
          address: toNull(address),
          taxId: toNull(taxId),
          registrationNumber: toNull(registrationNumber),
          yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness) : null,
          categories: toNull(categories),
          bio: toNull(bio),
        },
      });

      // --- REAL-TIME FEEDBACK ---
      await sendNotification({
        userId: userId!,
        type: "PROFILE_UPDATED",
        content: "Your business profile has been updated successfully.",
        room: userId,
      });

      // Sync the frontend header/avatar if phone or bio changed
      io.to(userId!).emit("profile_sync", updatedSupplier);

      await logActivity(
        "Supplier updated profile information",
        "INFO",
        userId,
        "Supplier.updateProfile",
      );

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedSupplier,
      });
    } catch (error) {
      handleError("PATCH /supplier/profile", error, res);
    }
  },

  deleteDocument: async (req: AuthenticatedRequest, res: Response) => {
    const { docId } = req.params as { docId: string };
    const userId = req.user?.id;

    try {
      const doc = await prisma.supplierDocument.findUnique({
        where: { id: docId },
      });

      if (!doc || doc.supplierId !== userId) {
        return res.status(403).json({ message: "Unauthorized or not found" });
      }

      if (doc.verifiedAt) {
        return res
          .status(403)
          .json({ message: "Cannot delete verified documents" });
      }

      await deleteFileIfExists(doc.filePath);

      await prisma.supplierDocument.delete({ where: { id: docId } });

      // --- NOTIFICATION ---
      await sendNotification({
        userId: userId!,
        type: "DOCUMENT_DELETED",
        content: `Document ${doc.documentType} has been removed from your profile.`,
        room: userId,
      });

      await logActivity(
        `Document deleted: ${doc.documentType}`,
        "INFO",
        userId,
        "Supplier.deleteDocument",
      );

      res.status(200).json({ success: true, message: "Document removed" });
    } catch (err) {
      handleError("DELETE /supplier/documents/:id", err, res);
    }
  },
  getMyBids: async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id!;
    try {
      const bids = await prisma.bid.findMany({
        where: {
          supplierId: userId,
        },

        include: {
          rfp: {
            select: {
              id: true,
              title: true,
              category: true,
              budget: true,
              currency: true,
              deadline: true,
              status: true,
              buyer: { select: { companyName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json({
        success: true,
        message: `${userId} bids`,
        data: bids,
      });
    } catch (error) {
      console.error("[SUPPLIER_CONTROLLER_GET_MY_BIDS");
      handleError("GET /supplier/bids", error, res);
    }
  },

  getEligibleSuppliers: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const buyerId = req.user?.id;
      const { rfpId, searchTerm, category, limit, page } = req.query;

      console.log(req.query);
      if (!buyerId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, parseInt(limit as string) || 20);
      const skip = (pageNum - 1) * limitNum;

      // Build filter conditions
      const whereConditions: any = {
        status: "VERIFIED",
        user: {
          isActive: true,
        },
      };

      // Category filter
      if (category) {
        whereConditions.categories = {
          has: category as string,
        };
      } else if (rfpId) {
        // Get RFP categories to match
        const rfp = await prisma.rfp.findUnique({
          where: { id: rfpId as string },
          select: { category: true },
        });

        if (rfp && rfp.category) {
          const categories = rfp.category.split(",").map((c) => c.trim());
          whereConditions.categories = {
            hasSome: categories,
          };
        }
      }

      // Search filter
      if (searchTerm) {
        whereConditions.OR = [
          {
            businessName: {
              contains: searchTerm as string,
              mode: "insensitive",
            },
          },
          {
            user: {
              email: { contains: searchTerm as string, mode: "insensitive" },
            },
          },
          {
            user: {
              firstName: {
                contains: searchTerm as string,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              lastName: { contains: searchTerm as string, mode: "insensitive" },
            },
          },
        ];
      }

      // If RFP ID provided, exclude already invited suppliers
      let invitedSupplierIds: string[] = [];
      if (rfpId) {
        const existingInvitations = await prisma.bidRoomInvitation.findMany({
          where: {
            bidRoom: {
              rfpId: rfpId as string,
            },
          },
          select: { supplierId: true },
        });
        invitedSupplierIds = existingInvitations.map((inv) => inv.supplierId);

        if (invitedSupplierIds.length > 0) {
          whereConditions.id = {
            notIn: invitedSupplierIds,
          };
        }
      }

      // Get total count
      const total = await prisma.supplier.count({
        where: whereConditions,
      });

      // Get eligible suppliers
      const suppliers = await prisma.supplier.findMany({
        where: whereConditions,
        select: {
          id: true,
          businessName: true,
          phone: true,
          address: true,
          businessType: true,
          categories: true,
          verificationStatus: true,
          yearsInBusiness: true,
          taxId: true,
          registrationNumber: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              bids: true,
              documents: true,
            },
          },
        },
        orderBy: [{ businessName: "asc" }],
        skip,
        take: limitNum,
      });

      // Calculate average bid amount (optional ranking metric)
      const suppliersWithMetrics = await Promise.all(
        suppliers.map(async (supplier) => {
          const bids = await prisma.bid.aggregate({
            where: {
              supplierId: supplier.id,
              status: { in: ["ACTIVE", "AWARDED"] },
            },
            _avg: {
              amount: true,
            },
          });

          return {
            ...supplier,
            averageBidAmount: bids._avg.amount || 0,
            totalBidsSubmitted: supplier._count.bids,
            totalDocuments: supplier._count.documents,
          };
        }),
      );

      return res.status(200).json({
        success: true,
        data: suppliersWithMetrics,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        filters: {
          rfpId: rfpId || null,
          category: category || null,
          searchTerm: searchTerm || null,
        },
      });
    } catch (error) {
      console.error("[GET_ELIGIBLE_SUPPLIERS]", error);
      handleError("GET /eligible-suppliers", error, res);
    }
  },

  getSupplierForInvitation: async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    try {
      const { supplierId } = req.params as { supplierId: string };
      const buyerId = req.user?.id;

      if (!buyerId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const supplier = await prisma.supplier.findUnique({
        where: {
          id: supplierId,
          status: "VERIFIED",
        },
        select: {
          id: true,
          businessName: true,
          phone: true,
          address: true,
          businessType: true,
          categories: true,
          verificationStatus: true,
          yearsInBusiness: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          bids: {
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
              rfp: {
                select: {
                  title: true,
                  status: true,
                  buyer: {
                    select: {
                      companyName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found or not verified",
        });
      }

      // Get performance metrics
      const bids = await prisma.bid.aggregate({
        where: {
          supplierId,
          status: "AWARDED",
        },
        _count: true,
        _avg: {
          amount: true,
        },
      });

      const responseData = {
        ...supplier,
        metrics: {
          awardedBids: bids._count,
          averageBidAmount: bids._avg.amount || 0,
        },
      };

      return res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error("[GET_SUPPLIER_FOR_INVITATION]", error);
      handleError("GET /eligible-suppliers/:supplierId", error, res);
    }
  },
};
