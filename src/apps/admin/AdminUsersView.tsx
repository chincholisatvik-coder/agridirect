import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Phone,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  Building,
  ShoppingBag,
  Package,
} from 'lucide-react';
import { useAgridirect } from '../../context/AgridirectContext';
import { User, UserRole } from '../../types/agridirect';

export const AdminUsersView: React.FC = () => {
  const { users, products, orders, toggleFarmerKyc, t } = useAgridirect();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<string>('ALL');

  // Counts
  const farmersCount = users.filter((u) => u.role === 'FARMER').length;
  const buyersCount = users.filter((u) => u.role === 'BUYER').length;
  const adminsCount = users.filter((u) => u.role === 'ADMIN').length;
  const verifiedCount = users.filter((u) => u.isVerified).length;

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role match
      if (selectedRole !== 'ALL' && u.role !== selectedRole) {
        return false;
      }
      // Verification status match
      if (selectedVerification === 'VERIFIED' && !u.isVerified) return false;
      if (selectedVerification === 'UNVERIFIED' && u.isVerified) return false;

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = u.name.toLowerCase().includes(query);
        const phoneMatch = u.phone.includes(query);
        const usernameMatch = (u.username || '').toLowerCase().includes(query);
        const locMatch = u.locationName.toLowerCase().includes(query);
        const rtcMatch = (u.kycDocumentId || '').toLowerCase().includes(query);
        return nameMatch || phoneMatch || usernameMatch || locMatch || rtcMatch;
      }

      return true;
    });
  }, [users, selectedRole, selectedVerification, searchQuery]);

  // Helper to count farmer listings
  const getFarmerListingsCount = (farmerId: string) => {
    return products.filter((p) => p.farmerId === farmerId).length;
  };

  // Helper to count buyer orders
  const getBuyerOrdersCount = (buyerId: string) => {
    return orders.filter((o) => o.buyerId === buyerId).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">Total Registered</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-stone-900">{users.length}</div>
          <span className="text-[10px] text-stone-400">All authenticated profiles</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">Farmers (Producers)</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{farmersCount}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {users.filter((u) => u.role === 'FARMER' && u.isVerified).length} Land RTC Verified
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">Buyers (Consumers)</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{buyersCount}</div>
          <span className="text-[10px] text-stone-400">Neighborhood direct buyers</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">State Officials</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{adminsCount}</div>
          <span className="text-[10px] text-stone-400">Directorate Authorities</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-6">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-stone-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-emerald-700" />
              User Directory & State Registry
            </h2>
            <p className="text-xs text-stone-500">
              Complete roster of farmers, direct buyers, and administrators with land record status.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or RTC..."
              className="w-full pl-9 pr-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:border-emerald-700 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Role & Verification Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-stone-700 uppercase text-[11px] mr-1">Role:</span>
            {[
              { id: 'ALL', label: `All Users (${users.length})` },
              { id: 'FARMER', label: `Farmers (${farmersCount})` },
              { id: 'BUYER', label: `Buyers (${buyersCount})` },
              { id: 'ADMIN', label: `Admins (${adminsCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedRole(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl font-black transition text-xs ${
                  selectedRole === tab.id
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-white border-2 border-stone-300 text-stone-800 hover:bg-stone-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-black text-stone-700 uppercase text-[11px]">KYC Status:</span>
            <select
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value)}
              className="px-3 py-1.5 border-2 border-stone-300 rounded-xl bg-white font-black text-xs text-stone-900 focus:outline-none focus:border-emerald-700 shadow-sm"
            >
              <option value="ALL">All ({users.length})</option>
              <option value="VERIFIED">Verified ({verifiedCount})</option>
              <option value="UNVERIFIED">Pending ({users.length - verifiedCount})</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-stone-200 touch-scroll">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Location & Pincode</th>
                <th className="py-3 px-4">Land Record / KYC</th>
                <th className="py-3 px-4 text-center">Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400">
                    No users found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isFarmer = u.role === 'FARMER';
                  const isBuyer = u.role === 'BUYER';
                  const isAdmin = u.role === 'ADMIN';

                  return (
                    <tr key={u.id} className="hover:bg-stone-50/70 transition">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white shrink-0 ${
                              isFarmer
                                ? 'bg-emerald-700'
                                : isBuyer
                                ? 'bg-blue-600'
                                : 'bg-purple-700'
                            }`}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-extrabold text-stone-900 block text-sm">
                              {u.name}
                            </span>
                            <span className="text-[11px] text-stone-400 font-mono">
                              @{u.username || u.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isFarmer
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isBuyer
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-purple-100 text-purple-900 border border-purple-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Phone & UPI */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-stone-800 flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-stone-400" />
                            {u.phone}
                          </p>
                          {u.upiId && (
                            <p className="text-[10px] text-stone-500 font-mono">
                              UPI: {u.upiId}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <div className="flex items-start space-x-1 text-stone-700">
                          <MapPin className="w-3 h-3 mr-1 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{u.locationName} ({u.pincode})</span>
                        </div>
                      </td>

                      {/* Land Record RTC / KYC */}
                      <td className="py-3 px-4">
                        {isFarmer ? (
                          u.isVerified ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                                RTC Verified
                              </span>
                              <p className="text-[10px] text-stone-400 font-mono truncate max-w-[140px]">
                                {u.kycDocumentId || 'BHOOMI-KA-2026'}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                                <Clock className="w-3 h-3 mr-1 text-amber-700" />
                                KYC Pending
                              </span>
                              <p className="text-[10px] text-stone-400 font-mono truncate max-w-[140px]">
                                {u.kycDocumentId || 'Under Audit'}
                              </p>
                            </div>
                          )
                        ) : (
                          <span className="text-[11px] text-stone-400">Regular KYC (Aadhaar Verified)</span>
                        )}
                      </td>

                      {/* Activity Count */}
                      <td className="py-3 px-4 text-center">
                        {isFarmer && (
                          <span className="px-2 py-1 bg-stone-100 text-stone-800 font-extrabold rounded-lg text-xs">
                            {getFarmerListingsCount(u.id)} Listings
                          </span>
                        )}
                        {isBuyer && (
                          <span className="px-2 py-1 bg-stone-100 text-stone-800 font-extrabold rounded-lg text-xs">
                            {getBuyerOrdersCount(u.id)} Orders
                          </span>
                        )}
                        {isAdmin && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-800 font-bold rounded-lg text-xs">
                            Admin Staff
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isFarmer && !u.isVerified && (
                          <button
                            onClick={() => toggleFarmerKyc(u.id)}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-sm transition"
                          >
                            Approve RTC
                          </button>
                        )}
                        {isFarmer && u.isVerified && (
                          <button
                            onClick={() => toggleFarmerKyc(u.id)}
                            className="text-[11px] text-emerald-700 font-bold hover:underline"
                            title="Click to revoke verification if needed"
                          >
                            ✓ Verified
                          </button>
                        )}
                        {isBuyer && (
                          <span className="text-[11px] text-stone-500 font-semibold">
                            Buyer
                          </span>
                        )}
                        {isAdmin && (
                          <span className="text-[11px] text-purple-700 font-bold">
                            Directorate
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
