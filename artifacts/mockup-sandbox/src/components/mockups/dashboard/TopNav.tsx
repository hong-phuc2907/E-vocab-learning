export function TopNav() {
  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col font-sans">
      {/* Top navigation bar */}
      <header className="bg-[#1a3a3a] text-white px-6 py-0 flex items-center gap-0 h-14 shrink-0">
        <div className="flex items-center gap-2 pr-8 border-r border-white/20">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span className="font-serif font-bold text-lg">Lexify</span>
        </div>
        <nav className="flex items-center gap-1 px-4 flex-1">
          {[
            { label: "Tổng quan", active: true },
            { label: "Học bài" },
            { label: "Kiểm tra" },
            { label: "Từ vựng" },
            { label: "Thêm từ" },
          ].map((item) => (
            <button
              key={item.label}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                item.active
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-sm font-bold text-amber-900">T</div>
          <span className="text-sm text-white/80">Thành Lãy</span>
        </div>
      </header>

      {/* Main content — full width */}
      <main className="flex-1 px-10 py-8 max-w-6xl w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-[#1a3a3a]">Chào mừng trở lại</h1>
          <p className="text-[#5a6a5a] mt-1">Tiếp tục xây dựng vốn từ vựng của bạn hôm nay.</p>
        </div>

        {/* Stats row — full width at top */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Từ đã thành thạo", value: "24", icon: "🎯", color: "bg-emerald-50 border-emerald-200" },
            { label: "Chuỗi học", value: "7 ngày", icon: "🔥", color: "bg-orange-50 border-orange-200" },
            { label: "Tổng số từ", value: "158", icon: "📚", color: "bg-blue-50 border-blue-200" },
            { label: "Độ chính xác", value: "82%", icon: "⚡", color: "bg-purple-50 border-purple-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-[#1a3a3a]">{s.value}</div>
              <div className="text-xs text-[#5a6a5a] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Two-column content */}
        <div className="grid grid-cols-2 gap-5">
          {/* Word of the day */}
          <div className="bg-[#1a3a3a] rounded-2xl p-6 text-white">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-3">Từ trong ngày</div>
            <div className="text-2xl font-serif font-bold mb-1">ephemeral</div>
            <div className="text-white/60 text-sm mb-3">/ɪˈfem.ər.əl/ · tính từ</div>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-sm text-white/80">Chỉ tồn tại trong thời gian ngắn</div>
            <button className="mt-4 w-full bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium transition-colors">
              Học ngay →
            </button>
          </div>

          {/* Review queue */}
          <div className="bg-white border border-[#d8d0c4] rounded-2xl p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#8a9a8a] mb-3">Hàng chờ học</div>
            <div className="flex items-center justify-center h-28">
              <div className="text-center">
                <div className="text-4xl font-serif font-bold text-[#1a3a3a]">12</div>
                <div className="text-[#5a6a5a] text-sm mt-1">từ cần ôn tập</div>
              </div>
            </div>
            <button className="mt-2 w-full bg-[#1a3a3a] text-white rounded-lg py-2 text-sm font-medium">
              Bắt đầu ôn tập →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
