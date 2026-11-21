import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  Product,
  GroupBuyPool,
  Order,
  LanguageCode,
  PoolParticipant,
  PlatformReport,
  ReportCategory,
  ReportSeverity,
  ReportStatus,
} from '../types/agridirect';
import {
  SEED_USERS,
  SEED_PRODUCTS,
  SEED_POOLS,
  SEED_ORDERS,
  SEED_REPORTS,
} from '../data/seedData';
import { TRANSLATIONS } from '../i18n/translations';
import {
  syncProductToDb,
  syncOrderToDb,
  syncPoolToDb,
  syncReportToDb,
  isSupabaseConfigured,
} from '../services/supabase';
import { sanitizeInput, sanitizeUrl, sanitizeNumber } from '../utils/security';

interface NormalOrderInput {
  productId: string;
  quantityKg: number;
  fulfillmentType: 'SELF_PICKUP' | 'HOME_DELIVERY';
  buyerAddress: string;
  distanceKm: number;
  deliveryFee: number;
}

interface GroupPoolJoinInput {
  poolId?: string; // If undefined, creating new pool
  productId: string;
  localityName: string;
  localityPincode: string;
  dropOffAddress: string;
  targetQuantityKg?: number;
  quantityKg: number;
  fulfillmentType: 'SELF_PICKUP' | 'HOME_DELIVERY';
}

export interface RegisterInput {
  name: string;
  phone: string;
  password?: string;
  role: 'FARMER' | 'BUYER';
  locationName: string;
  pincode: string;
  kycDocumentId?: string;
}

interface AgridirectContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  products: Product[];
  pools: GroupBuyPool[];
  orders: Order[];
  activeTab: 'seller' | 'buyer' | 'admin';
  setActiveTab: (tab: 'seller' | 'buyer' | 'admin') => void;

  // Authentication
  login: (identifier: string, password?: string) => { success: boolean; message?: string };
  register: (data: RegisterInput) => { success: boolean; message?: string };
  loginWithGoogle: (data: {
    name: string;
    email: string;
    role?: 'FARMER' | 'BUYER';
    avatarUrl?: string;
  }) => { success: boolean; user: User };
  logout: () => void;

  reports: PlatformReport[];
  submitReport: (input: Omit<PlatformReport, 'id' | 'status' | 'createdAt'>) => PlatformReport;
  resolveReportAdmin: (reportId: string, status: ReportStatus, notes?: string) => void;
  openReportsCount: number;

  // Actions
  addProduct: (productData: Omit<Product, 'id'>) => Product;
  placeNormalOrder: (input: NormalOrderInput) => Order;
  joinOrCreateGroupPool: (input: GroupPoolJoinInput) => { pool: GroupBuyPool; order: Order };
  respondToDeliveryRequest: (orderId: string, decision: 'APPROVED' | 'REJECTED') => void;
  confirmOrderReceipt: (orderId: string) => void;
  raiseOrderDispute: (orderId: string, reason: string, photoUrl?: string) => void;
  resolveEscrowAdmin: (orderId: string, resolution: 'RELEASE_TO_FARMER' | 'REFUND_BUYER') => void;
  toggleFarmerKyc: (farmerId: string) => void;
  lockAndConfirmPool: (poolId: string) => void;
  expireAndRefundPool: (poolId: string) => void;
  resetToSeedData: () => void;

  // Live Notification Badges
  pendingDeliveryCount: number;
  activePoolsCount: number;
  pendingAdminActionCount: number;
}

const STORAGE_KEY = 'agridirect_store_v1';

const AgridirectContext = createContext<AgridirectContextType | undefined>(undefined);

export const AgridirectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or seed
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_lang`);
    return (saved as LanguageCode) || 'en';
  });

  const [activeTab, setActiveTab] = useState<'seller' | 'buyer' | 'admin'>('buyer');

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : SEED_USERS;
  });

  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_currUser`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return null; // Start with login screen if no saved session
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
    return saved ? JSON.parse(saved) : SEED_PRODUCTS;
  });

  const [pools, setPools] = useState<GroupBuyPool[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_pools`);
    return saved ? JSON.parse(saved) : SEED_POOLS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
    return saved ? JSON.parse(saved) : SEED_ORDERS;
  });

  const [reports, setReports] = useState<PlatformReport[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_reports`);
    return saved ? JSON.parse(saved) : SEED_REPORTS;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_lang`, language);
  }, [language]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${STORAGE_KEY}_currUser`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_currUser`);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pools`, JSON.stringify(pools));
  }, [pools]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_reports`, JSON.stringify(reports));
  }, [reports]);

  // Synchronize across tabs in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === `${STORAGE_KEY}_products` && e.newValue) {
        setProducts(JSON.parse(e.newValue));
      } else if (e.key === `${STORAGE_KEY}_pools` && e.newValue) {
        setPools(JSON.parse(e.newValue));
      } else if (e.key === `${STORAGE_KEY}_orders` && e.newValue) {
        setOrders(JSON.parse(e.newValue));
      } else if (e.key === `${STORAGE_KEY}_users` && e.newValue) {
        setUsers(JSON.parse(e.newValue));
      } else if (e.key === `${STORAGE_KEY}_reports` && e.newValue) {
        setReports(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user && user.preferredLanguage) {
      setLanguageState(user.preferredLanguage);
    }
  };

  // Translation helper
  const t = useCallback(
    (key: string): string => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
      return dict[key] || TRANSLATIONS.en[key] || key;
    },
    [language]
  );

  // Authentication: login, register, logout
  const login = useCallback(
    (identifier: string, password?: string): { success: boolean; message?: string } => {
      const trimmedId = identifier.trim().toLowerCase();
      const cleanPhone = identifier.replace(/\D/g, '');

      // 1. Admin login credentials: "admin" and "123"
      if (trimmedId === 'admin') {
        if (password === '123') {
          const adminUser = users.find((u) => u.role === 'ADMIN') || SEED_USERS[6];
          setCurrentUserState(adminUser);
          setActiveTab('admin');
          return { success: true };
        } else {
          return { success: false, message: 'Invalid admin credentials' };
        }
      }

      // 2. Regular user lookup (phone, username, or name)
      const matched = users.find((u) => {
        const uPhoneClean = u.phone.replace(/\D/g, '');
        return (
          u.username?.toLowerCase() === trimmedId ||
          u.phone === identifier.trim() ||
          (cleanPhone.length >= 6 && uPhoneClean.includes(cleanPhone)) ||
          u.name.toLowerCase() === trimmedId
        );
      });

      if (!matched) {
        return { success: false, message: t('loginFailed') };
      }

      // Check password (default is '123' if unset)
      const expectedPassword = matched.password || '123';
      if (password && password !== expectedPassword) {
        return { success: false, message: t('loginFailed') };
      }

      setCurrentUserState(matched);
      if (matched.role === 'FARMER') {
        setActiveTab('seller');
      } else if (matched.role === 'ADMIN') {
        setActiveTab('admin');
      } else {
        setActiveTab('buyer');
      }
      return { success: true };
    },
    [users, t]
  );

  const register = useCallback(
    (data: RegisterInput): { success: boolean; message?: string } => {
      if (!data.name.trim() || !data.phone.trim()) {
        return { success: false, message: t('fillRequired') };
      }

      const cleanPhone = data.phone.replace(/\D/g, '');
      const existing = users.find((u) => u.phone.replace(/\D/g, '') === cleanPhone);
      if (existing) {
        return { success: false, message: 'Phone number already registered. Please sign in.' };
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        role: data.role,
        name: data.name.trim(),
        phone: data.phone.trim(),
        username: data.phone.trim(),
        password: data.password || '123',
        preferredLanguage: language,
        locationName: data.locationName.trim() || 'Hubballi Rural, Karnataka',
        pincode: data.pincode.trim() || '580020',
        lat: 15.3647,
        lng: 75.1240,
        isVerified: data.role === 'BUYER', // Farmers need admin KYC verification
        kycDocumentId:
          data.kycDocumentId?.trim() ||
          (data.role === 'FARMER' ? 'KA-RTC-PENDING' : undefined),
      };

      setUsers((prev) => [newUser, ...prev]);
      setCurrentUserState(newUser);
      if (newUser.role === 'FARMER') {
        setActiveTab('seller');
      } else {
        setActiveTab('buyer');
      }
      return { success: true };
    },
    [users, language, t]
  );

  const loginWithGoogle = useCallback(
    (data: {
      name: string;
      email: string;
      role?: 'FARMER' | 'BUYER';
      avatarUrl?: string;
    }): { success: boolean; user: User } => {
      const cleanEmail = data.email.trim().toLowerCase();
      // Check if user already exists with this email or username
      let matched = users.find(
        (u) =>
          u.email?.toLowerCase() === cleanEmail ||
          u.username?.toLowerCase() === cleanEmail.split('@')[0] ||
          u.name.toLowerCase() === data.name.trim().toLowerCase()
      );

      if (matched) {
        // Log in existing user
        setCurrentUserState(matched);
        if (matched.role === 'FARMER') {
          setActiveTab('seller');
        } else if (matched.role === 'ADMIN') {
          setActiveTab('admin');
        } else {
          setActiveTab('buyer');
        }
        return { success: true, user: matched };
      }

      // Automatically register new user via Google
      const targetRole = data.role || 'BUYER';
      const newUser: User = {
        id: `user-google-${Date.now()}`,
        role: targetRole,
        name: data.name.trim(),
        email: cleanEmail,
        phone: '+91 9' + Math.floor(100000000 + Math.random() * 900000000),
        username: cleanEmail.split('@')[0],
        password: '123',
        preferredLanguage: language,
        locationName:
          targetRole === 'FARMER'
            ? 'Hubballi Rural Agricultural Belt, Karnataka'
            : 'Vidyanagar, Hubballi, Karnataka',
        pincode: targetRole === 'FARMER' ? '580024' : '580021',
        lat: 15.3647,
        lng: 75.1240,
        isVerified: targetRole === 'BUYER',
        kycDocumentId: targetRole === 'FARMER' ? 'KA-RTC-GOOGLE-PENDING' : undefined,
        avatarUrl:
          data.avatarUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
        authProvider: 'GOOGLE',
      };

      setUsers((prev) => [newUser, ...prev]);
      setCurrentUserState(newUser);
      if (newUser.role === 'FARMER') {
        setActiveTab('seller');
      } else {
        setActiveTab('buyer');
      }
      return { success: true, user: newUser };
    },
    [users, language]
  );

  const logout = useCallback(() => {
    setCurrentUserState(null);
    localStorage.removeItem(`${STORAGE_KEY}_currUser`);
  }, []);

  // 1. Add Product
  const addProduct = useCallback(
    (productData: Omit<Product, 'id'>): Product => {
      const id = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newProduct: Product = {
        ...productData,
        id,
      };
      setProducts((prev) => [newProduct, ...prev]);
      syncProductToDb(newProduct);
      return newProduct;
    },
    []
  );

  // 2. Place Normal Order
  const placeNormalOrder = useCallback(
    (input: NormalOrderInput): Order => {
      const product = products.find((p) => p.id === input.productId);
      if (!product) throw new Error('Product not found');

      const safeQty = sanitizeNumber(input.quantityKg, 1, product.availableStockKg, 1);
      const safeDeliveryFee = sanitizeNumber(input.deliveryFee, 0, 10000, 0);
      const safeDistance = sanitizeNumber(input.distanceKm, 0, 1000, 0);
      const unitPrice = product.normalPricePerKg;
      const subtotal = safeQty * unitPrice;
      const totalAmount = subtotal + safeDeliveryFee;

      const needsFarmerApproval =
        input.fulfillmentType === 'HOME_DELIVERY' && product.homeDeliveryAvailable;

      const orderId = `ord-norm-${Date.now()}`;
      const newOrder: Order = {
        id: orderId,
        buyerId: currentUser ? currentUser.id : 'user-buyer-1',
        buyerName: currentUser ? currentUser.name : 'Registered Buyer',
        farmerId: product.farmerId,
        farmerName: product.farmerName,
        productId: product.id,
        productTitle: product.title,
        orderType: 'NORMAL',
        quantityKg: safeQty,
        unitPriceApplied: unitPrice,
        subtotalAmount: subtotal,
        fulfillmentType: input.fulfillmentType,
        farmerDeliveryApproval: needsFarmerApproval ? 'PENDING' : 'NOT_REQUIRED',
        buyerAddress: sanitizeInput(input.buyerAddress),
        distanceKm: safeDistance,
        deliveryFee: safeDeliveryFee,
        totalAmount,
        status: 'ESCROW_HELD',
        createdAt: new Date().toISOString(),
      };

      // Deduct stock
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, availableStockKg: Math.max(0, p.availableStockKg - input.quantityKg) }
            : p
        )
      );

      setOrders((prev) => [newOrder, ...prev]);
      syncOrderToDb(newOrder);
      return newOrder;
    },
    [products, currentUser]
  );

  // 3. Join Or Create Group Pool
  const joinOrCreateGroupPool = useCallback(
    (input: GroupPoolJoinInput): { pool: GroupBuyPool; order: Order } => {
      const product = products.find((p) => p.id === input.productId);
      if (!product) throw new Error('Product not found');

      let targetPool: GroupBuyPool;
      let isNewPool = false;

      if (input.poolId) {
        const found = pools.find((p) => p.id === input.poolId);
        if (!found) throw new Error('Pool not found');
        targetPool = { ...found };
      } else {
        isNewPool = true;
        const targetKg = input.targetQuantityKg || product.bulkMinQuantityKg;
        targetPool = {
          id: `pool-${Date.now()}`,
          productId: product.id,
          hostBuyerId: currentUser ? currentUser.id : 'user-buyer-1',
          hostBuyerName: currentUser ? currentUser.name : 'Registered Buyer',
          localityName: input.localityName,
          localityPincode: input.localityPincode,
          dropOffAddress: input.dropOffAddress,
          targetQuantityKg: targetKg,
          maxQuantityKg: product.bulkMaxQuantityKg,
          currentQuantityKg: 0,
          unitBulkPrice: product.bulkPricePerKg,
          fulfillmentType: input.fulfillmentType,
          estimatedDeliveryFeeTotal: input.fulfillmentType === 'HOME_DELIVERY' ? 65 : 0,
          status: 'OPEN',
          expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          participants: [],
        };
      }

      // Proportional delivery share
      const deliveryShare =
        targetPool.fulfillmentType === 'HOME_DELIVERY' && targetPool.targetQuantityKg > 0
          ? Math.round(
              targetPool.estimatedDeliveryFeeTotal *
                (input.quantityKg / targetPool.targetQuantityKg)
            )
          : 0;

      const subtotal = input.quantityKg * targetPool.unitBulkPrice;
      const totalEscrow = subtotal + deliveryShare;

      const participant: PoolParticipant = {
        buyerId: currentUser ? currentUser.id : 'user-buyer-1',
        buyerName: currentUser ? currentUser.name : 'Registered Buyer',
        quantityKg: input.quantityKg,
        amountPaidEscrow: totalEscrow,
        joinedAt: new Date().toISOString(),
      };

      const updatedParticipants = [...targetPool.participants, participant];
      const updatedTotalKg = targetPool.currentQuantityKg + input.quantityKg;
      const isThresholdMet = updatedTotalKg >= targetPool.targetQuantityKg;

      const finalPoolStatus = isThresholdMet ? 'LOCKED_CONFIRMED' : 'OPEN';

      const updatedPool: GroupBuyPool = {
        ...targetPool,
        currentQuantityKg: updatedTotalKg,
        status: finalPoolStatus,
        participants: updatedParticipants,
      };

      // Order created for this participant
      const orderId = `ord-pool-${Date.now()}`;
      const newOrder: Order = {
        id: orderId,
        buyerId: currentUser ? currentUser.id : 'user-buyer-1',
        buyerName: currentUser ? currentUser.name : 'Registered Buyer',
        farmerId: product.farmerId,
        farmerName: product.farmerName,
        productId: product.id,
        productTitle: product.title,
        orderType: 'GROUP_BULK',
        poolId: updatedPool.id,
        quantityKg: input.quantityKg,
        unitPriceApplied: targetPool.unitBulkPrice,
        subtotalAmount: subtotal,
        fulfillmentType: targetPool.fulfillmentType,
        farmerDeliveryApproval: 'APPROVED',
        buyerAddress: `${input.dropOffAddress} (${input.localityName})`,
        distanceKm: 8.5,
        deliveryFee: deliveryShare,
        totalAmount: totalEscrow,
        status: isThresholdMet ? 'CONFIRMED_PREPARING' : 'AWAITING_POOL_COMPLETION',
        createdAt: new Date().toISOString(),
      };

      // If threshold is reached, automatically deduct stock from product and update all linked orders
      if (isThresholdMet) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? { ...p, availableStockKg: Math.max(0, p.availableStockKg - updatedTotalKg) }
              : p
          )
        );

        setOrders((prev) =>
          prev.map((o) =>
            o.poolId === updatedPool.id
              ? { ...o, status: 'CONFIRMED_PREPARING' }
              : o
          )
        );
      }

      // Update pools list
      setPools((prev) => {
        if (isNewPool) {
          return [updatedPool, ...prev];
        }
        return prev.map((p) => (p.id === updatedPool.id ? updatedPool : p));
      });

      setOrders((prev) => [newOrder, ...prev]);
      syncPoolToDb(updatedPool);
      syncOrderToDb(newOrder);

      return { pool: updatedPool, order: newOrder };
    },
    [products, pools, currentUser]
  );

  // 4. Respond To Delivery Request (Farmer Action)
  const respondToDeliveryRequest = useCallback(
    (orderId: string, decision: 'APPROVED' | 'REJECTED') => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;

          if (decision === 'APPROVED') {
            return {
              ...order,
              farmerDeliveryApproval: 'APPROVED',
              status: 'OUT_FOR_DELIVERY',
            };
          } else {
            // Decline Home Delivery -> converts to Self-Pickup and credits back delivery fee
            return {
              ...order,
              farmerDeliveryApproval: 'REJECTED',
              fulfillmentType: 'SELF_PICKUP',
              totalAmount: order.subtotalAmount, // refund delivery fee
              deliveryFee: 0,
              status: 'READY_FOR_PICKUP',
            };
          }
        })
      );
    },
    []
  );

  // 5. Confirm Order Receipt (Buyer Action -> Releases Escrow to Farmer)
  const confirmOrderReceipt = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'COMPLETED_RELEASED_TO_FARMER',
              deliveredAt: order.deliveredAt || new Date().toISOString(),
            }
          : order
      )
    );
  }, []);

  // 6. Raise Dispute (Buyer Action -> Freezes Escrow)
  const raiseOrderDispute = useCallback(
    (orderId: string, reason: string, photoUrl?: string) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: 'DISPUTED_FROZEN',
                disputeReason: sanitizeInput(reason),
                disputePhotoUrl: photoUrl ? sanitizeUrl(photoUrl) : undefined,
              }
            : order
        )
      );
    },
    []
  );

  // 7. Resolve Escrow Dispute (Admin Action)
  const resolveEscrowAdmin = useCallback(
    (orderId: string, resolution: 'RELEASE_TO_FARMER' | 'REFUND_BUYER') => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            status:
              resolution === 'RELEASE_TO_FARMER'
                ? 'COMPLETED_RELEASED_TO_FARMER'
                : 'REFUNDED_TO_BUYER',
          };
        })
      );
    },
    []
  );

  // 8. Toggle Farmer KYC (Admin Action)
  const toggleFarmerKyc = useCallback((farmerId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === farmerId ? { ...u, isVerified: !u.isVerified } : u))
    );
    setProducts((prev) =>
      prev.map((p) =>
        p.farmerId === farmerId ? { ...p, farmerVerified: !p.farmerVerified } : p
      )
    );
  }, []);

  // 9. Admin Force Lock Pool
  const lockAndConfirmPool = useCallback((poolId: string) => {
    setPools((prev) =>
      prev.map((pool) => {
        if (pool.id !== poolId) return pool;
        return { ...pool, status: 'LOCKED_CONFIRMED' };
      })
    );
    setOrders((prev) =>
      prev.map((order) =>
        order.poolId === poolId ? { ...order, status: 'CONFIRMED_PREPARING' } : order
      )
    );
  }, []);

  // 10. Admin Expire & Refund Pool
  const expireAndRefundPool = useCallback((poolId: string) => {
    setPools((prev) =>
      prev.map((pool) => {
        if (pool.id !== poolId) return pool;
        return { ...pool, status: 'EXPIRED_REFUNDED' };
      })
    );
    setOrders((prev) =>
      prev.map((order) =>
        order.poolId === poolId ? { ...order, status: 'REFUNDED_TO_BUYER' } : order
      )
    );
  }, []);

  // 11. Reset to seed data
  const resetToSeedData = useCallback(() => {
    localStorage.removeItem(`${STORAGE_KEY}_products`);
    localStorage.removeItem(`${STORAGE_KEY}_pools`);
    localStorage.removeItem(`${STORAGE_KEY}_orders`);
    localStorage.removeItem(`${STORAGE_KEY}_users`);
    localStorage.removeItem(`${STORAGE_KEY}_reports`);
    setProducts(SEED_PRODUCTS);
    setPools(SEED_POOLS);
    setOrders(SEED_ORDERS);
    setUsers(SEED_USERS);
    setReports(SEED_REPORTS);
  }, []);

  // 12. Submit Platform Incident Report (Buyer or Farmer)
  const submitReport = useCallback(
    (input: Omit<PlatformReport, 'id' | 'status' | 'createdAt'>): PlatformReport => {
      const id = `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newReport: PlatformReport = {
        ...input,
        id,
        reporterName: sanitizeInput(input.reporterName),
        title: sanitizeInput(input.title),
        description: sanitizeInput(input.description),
        evidencePhotoUrl: input.evidencePhotoUrl ? sanitizeUrl(input.evidencePhotoUrl) : undefined,
        status: 'OPEN_PENDING',
        createdAt: new Date().toISOString(),
      };
      setReports((prev) => [newReport, ...prev]);
      syncReportToDb(newReport);
      return newReport;
    },
    []
  );

  // 13. Admin Resolve Platform Report
  const resolveReportAdmin = useCallback(
    (reportId: string, status: ReportStatus, notes?: string) => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status,
                adminNotes: notes || r.adminNotes,
                resolvedAt:
                  status === 'RESOLVED' || status === 'DISMISSED'
                    ? new Date().toISOString()
                    : undefined,
              }
            : r
        )
      );
    },
    []
  );

  // Notification Counts
  const pendingDeliveryCount = orders.filter(
    (o) => o.farmerDeliveryApproval === 'PENDING'
  ).length;

  const activePoolsCount = pools.filter((p) => p.status === 'OPEN').length;

  const openReportsCount = reports.filter(
    (r) => r.status === 'OPEN_PENDING' || r.status === 'UNDER_INVESTIGATION'
  ).length;

  const pendingAdminActionCount =
    users.filter((u) => u.role === 'FARMER' && !u.isVerified).length +
    orders.filter((o) => o.status === 'DISPUTED_FROZEN').length +
    openReportsCount;

  return (
    <AgridirectContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentUser,
        setCurrentUser,
        users,
        products,
        pools,
        orders,
        reports,
        submitReport,
        resolveReportAdmin,
        openReportsCount,
        activeTab,
        setActiveTab,
        login,
        register,
        loginWithGoogle,
        logout,
        addProduct,
        placeNormalOrder,
        joinOrCreateGroupPool,
        respondToDeliveryRequest,
        confirmOrderReceipt,
        raiseOrderDispute,
        resolveEscrowAdmin,
        toggleFarmerKyc,
        lockAndConfirmPool,
        expireAndRefundPool,
        resetToSeedData,
        pendingDeliveryCount,
        activePoolsCount,
        pendingAdminActionCount,
      }}
    >
      {children}
    </AgridirectContext.Provider>
  );
};

export const useAgridirect = (): AgridirectContextType => {
  const context = useContext(AgridirectContext);
  if (!context) {
    throw new Error('useAgridirect must be used within an AgridirectProvider');
  }
  return context;
};

