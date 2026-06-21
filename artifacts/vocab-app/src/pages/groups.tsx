{rootGroups.map((group) => (
  <div key={group.id} className="border rounded-xl p-4 hover:shadow-lg transition-all bg-card">
    {/* Khu vực bấm vào để xem chi tiết nhóm */}
    <Link href={`/groups/${group.id}`}>
      <div className="cursor-pointer">
        <div className="text-3xl mb-2">📁</div>
        <p className="font-semibold text-lg">
          {group.name}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {group.wordCount || 0} từ vựng
        </p>
      </div>
    </Link>

    {/* Nút Quiz dẫn đến trang quiz kèm query param group */}
    <Button
      asChild
      size="sm"
      className="mt-4 w-full"
    >
      <Link href={`/quiz?group=${group.id}`}>
        Làm bài kiểm tra
      </Link>
    </Button>
  </div>
))}
