#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
  echo -e "${GREEN}使用方法:${NC}"
  echo "  $0 [选项] <测试文件路径>"
  echo ""
  echo -e "${GREEN}选项:${NC}"
  echo "  -h, --help    显示帮助信息"
  echo "  -o, --output  指定输出目录 (默认: output/results)"
  echo ""
  echo -e "${GREEN}示例:${NC}"
  echo "  $0 output/login-test.js"
  echo "  $0 -o output/custom-results output/login-test.js"
  exit 0
}

# 默认参数
OUTPUT_DIR="output/results"
TEST_FILES=()

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
  -h | --help)
    show_help
    ;;
  -o | --output)
    OUTPUT_DIR="$2"
    shift 2
    ;;
  *)
    TEST_FILES+=("$1")
    shift
    ;;
  esac
done

# 检查是否提供了测试文件
if [ ${#TEST_FILES[@]} -eq 0 ]; then
  echo -e "${RED}错误: 请提供至少一个测试文件${NC}"
  show_help
  exit 1
fi

# 创建测试结果目录
mkdir -p "$OUTPUT_DIR"

# 打印测试开始信息
echo -e "${GREEN}开始性能测试...${NC}"
echo -e "${YELLOW}当前时间: $(date)${NC}"
echo -e "${YELLOW}输出目录: $OUTPUT_DIR${NC}"

# 运行测试
for test_file in "${TEST_FILES[@]}"; do
  if [ ! -f "$test_file" ]; then
    echo -e "${RED}错误: 测试文件不存在: $test_file${NC}"
    continue
  fi

  # 从文件名生成结果文件名
  test_name=$(basename "$test_file" .js)
  result_file="${OUTPUT_DIR}/${test_name}.json"
  summary_file="${OUTPUT_DIR}/${test_name}-summary.json"
  influx_file="${OUTPUT_DIR}/${test_name}-influx.json"
  csv_file="${OUTPUT_DIR}/${test_name}.csv"

  echo -e "\n${GREEN}运行测试: $test_file${NC}"

  # 使用 Docker 运行测试并输出多种格式的结果
  docker run -i --rm \
    -v "$(pwd):/src" \
    -v "$(pwd)/${OUTPUT_DIR}:/output" \
    --user "$(id -u):$(id -g)" \
    --add-host=host.docker.internal:host-gateway \
    grafana/k6 run \
    --summary-export="/output/${test_name}-summary.json" \
    --out json="/output/${test_name}.json" \
    --out influxdb="http://host.docker.internal:8086/k6" \
    --out csv="/output/${test_name}.csv" \
    "/src/${test_file}"

  # 检查测试结果
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}测试完成: $test_file${NC}"
    echo -e "${YELLOW}测试摘要已保存到: $summary_file${NC}"
    echo -e "${YELLOW}详细数据已保存到: $result_file${NC}"
    echo -e "${YELLOW}时序数据已保存到: $influx_file${NC}"
    echo -e "${YELLOW}CSV数据已保存到: $csv_file${NC}"
  else
    echo -e "${RED}测试失败: $test_file${NC}"
    exit 1
  fi
done

# 生成HTML报告
echo -e "\n${GREEN}生成测试报告...${NC}"
docker run -i --rm \
  -v "$(pwd)/${OUTPUT_DIR}:/output" \
  grafana/k6 convert "/output"/*-summary.json -o "/output/report.html"

# 检查报告生成结果
if [ $? -eq 0 ]; then
  echo -e "${GREEN}测试报告已生成: ${OUTPUT_DIR}/report.html${NC}"
else
  echo -e "${RED}报告生成失败${NC}"
  exit 1
fi

# 打印测试完成信息
echo -e "\n${GREEN}所有测试完成!${NC}"
echo -e "${YELLOW}测试报告位置: ${OUTPUT_DIR}/report.html${NC}"
echo -e "${YELLOW}完成时间: $(date)${NC}"

# 提示用户可以使用Grafana查看测试曲线
echo -e "\n${GREEN}提示:${NC}"
echo -e "测试结果已保存为多种格式:"
echo -e "1. JSON格式 (详细数据): ${OUTPUT_DIR}/*.json"
echo -e "2. CSV格式 (表格数据): ${OUTPUT_DIR}/*.csv"
echo -e "3. HTML报告: ${OUTPUT_DIR}/report.html"
echo -e "\n要查看实时测试曲线，您可以:"
echo -e "1. 安装并运行 InfluxDB 和 Grafana"
echo -e "2. 在 Grafana 中导入 k6 的官方仪表板"
echo -e "3. 使用以下命令运行测试:"
echo -e "   docker run -i --rm grafana/k6 run --out influxdb=http://localhost:8086/k6 /src/$test_file"
