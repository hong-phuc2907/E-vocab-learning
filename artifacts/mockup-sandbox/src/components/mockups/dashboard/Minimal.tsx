export function Minimal() {
  return (
    <div className="min-h-screen bg-white flex font-sans">
      {/* Sidebar — same width as original but cleaner */}
      <aside className="w-52 border-r border-[#ede8e0] flex flex-col py-6 px-4 shrink-0 bg-[#faf8f5]">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-7 h-7 bg-[#1a3a3a] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">L</span>
          </div>
          <span className="font-serif font-bold text-[#1a3a3a] text-lg">Lexify</span>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {[
            { label: "Tổng quan", active: true },
            { label: "Học bài" },
            { label: "Kiểm tra" },
            { label: "Từ vựng" },
            { label: "Thêm từ" },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                item.active
                  ? "bg-[#1a3a3a] text-white"
                  : "text-[#5a6a5a] hover:bg-[#ede8e0]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-[#ede8e0] pt-4 mt-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-amber-900">T</div>
            <div>
              <p className="text-xs font-medium text-[#1a3a3a]">Thành Lãy</p>
              <p className="text-xs text-[#8a9a8a]">vipern1763</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Single-column content */}
      <main className="flex-1 px-8 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-serif font-bold text-[#1a3a3a]">Chào mừng trở lại</h1>
          <p className="text-[#8a9a8a] text-sm mt-0.5">Tiếp tục xây dựng vốn từ vựng của bạn hôm nay.</p>
        </div>

        {/* Stats — compact horizontal strip */}
        <div className="flex gap-3 mb-6">
          {[
            { label: "Thành thạo", value: "24", accent: "text-emerald-600" },
            { label: "Chuỗi học", value: "7🔥", accent: "text-orange-500" },
            { label: "Tổng từ", value: "158", accent: "text-blue-600" },
            { label: "Chính xác", value: "82%", accent: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-[#faf8f5] border border-[#ede8e0] rounded-xl px-3 py-3 text-center">
              <div className={`text-lg font-bold ${s.accent}`}>{s.value}</div>
              <div className="text-xs text-[#8a9a8a] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Word of day — full width, tall card */}
        <div className="bg-[#1a3a3a] rounded-2xl p-6 text-white mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/50">Từ trong ngày</span>
            <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">Khó</span>
          </div>
          <div className="text-2xl font-serif font-bold">ephemeral</div>
          <div className="text-white/50 text-sm mt-0.5 mb-3">/ɪˈfem.ər.əl/ · tính từ</div>
          <div className="text-white/80 text-sm bg-white/10 rounded-lg px-4 py-2.5">
            Chỉ tồn tại trong thời gian ngắn; thoáng qua.
          </div>
        </div>

        {/* Review queue — compact row */}
        <div className="flex items-center justify-between bg-[#faf8f5] border border-[#ede8e0] rounded-2xl px-6 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#8a9a8a] mb-0.5">Hàng chờ học</div>
            <div className="text-xl font-serif font-bold text-[#1a3a3a]">12 từ cần ôn tập</div>
          </div>
          <button className="bg-[#1a3a3a] text-white text-sm font-medium px-5 py-2.5 rounded-xl">
            Bắt đầu →
          </button>
        </div>
      </main>
    </div>
  );
}
