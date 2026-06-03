namespace SnakeGame;

/// <summary>
/// 网格坐标。X 为列(向右增长),Y 为行(向下增长)。
/// </summary>
internal readonly record struct Point(int X, int Y)
{
    public static Point operator +(Point a, Point b) => new(a.X + b.X, a.Y + b.Y);
}
