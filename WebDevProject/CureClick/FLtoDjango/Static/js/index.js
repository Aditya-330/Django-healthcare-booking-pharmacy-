document.addEventListener('DOMContentLoaded', function() {
    // Simple animation to enhance the floating effect
    const floatingElements = document.querySelectorAll('.floating');
    
    floatingElements.forEach((element, index) => {
        const delay = index * 0.5;
        element.style.animationDelay = `${delay}s`;
    });
});

    function initSatisfactionChart() {
      const chart = echarts.init(document.getElementById("satisfactionChart"));
      const option = {
        animation: false,
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            color: "#1f2937",
          },
          formatter: function (params) {
            let result = `${params[0].axisValue}<br/>`;
            params.forEach((param) => {
              result += `<div style="display:flex;justify-content:space-between;margin:8px 0;">
    <span style="margin-right:16px;">
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${param.color};margin-right:8px;"></span>
    ${param.seriesName}</span>
    <span style="font-weight:600">${param.value}%</span>
    </div>`;
            });
            return result;
          },
        },
        grid: {
          top: "8%",
          left: "0%",
          right: "0%",
          bottom: "15%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: ["2023 Q2", "2023 Q3", "2023 Q4", "2024 Q1", "2024 Q2"],
          axisLine: {
            lineStyle: {
              color: "#eee",
            },
          },
          axisLabel: {
            color: "#666",
            fontSize: 12,
            padding: [8, 0],
          },
        },
        yAxis: {
          type: "value",
          min: 80,
          max: 100,
          interval: 5,
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            lineStyle: {
              color: "#f5f5f5",
              type: "dashed",
            },
          },
          axisLabel: {
            color: "#666",
            fontSize: 12,
            formatter: "{value}%",
          },
        },
        series: [
          {
            name: "Overall Satisfaction",
            type: "line",
            smooth: true,
            data: [90, 92, 95, 97, 98],
            lineStyle: {
              color: "rgba(87, 181, 231, 1)",
              width: 3,
            },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(87, 181, 231, 0.15)",
                  },
                  {
                    offset: 1,
                    color: "rgba(87, 181, 231, 0.01)",
                  },
                ],
              },
            },
            symbol: "circle",
            symbolSize: 8,
            itemStyle: {
              color: "rgba(87, 181, 231, 1)",
              borderColor: "#fff",
              borderWidth: 2,
            },
          },
          {
            name: "Booking Experience",
            type: "line",
            smooth: true,
            data: [88, 90, 93, 96, 98],
            lineStyle: {
              color: "rgba(141, 211, 199, 1)",
              width: 3,
            },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(141, 211, 199, 0.15)",
                  },
                  {
                    offset: 1,
                    color: "rgba(141, 211, 199, 0.01)",
                  },
                ],
              },
            },
            symbol: "circle",
            symbolSize: 8,
            itemStyle: {
              color: "rgba(141, 211, 199, 1)",
              borderColor: "#fff",
              borderWidth: 2,
            },
          },
          {
            name: "Doctor Quality",
            type: "line",
            smooth: true,
            data: [92, 94, 96, 97, 99],
            lineStyle: {
              color: "rgba(251, 191, 114, 1)",
              width: 3,
            },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(251, 191, 114, 0.15)",
                  },
                  {
                    offset: 1,
                    color: "rgba(251, 191, 114, 0.01)",
                  },
                ],
              },
            },
            symbol: "circle",
            symbolSize: 8,
            itemStyle: {
              color: "rgba(251, 191, 114, 1)",
              borderColor: "#fff",
              borderWidth: 2,
            },
          },
        ],
        legend: {
          data: ["Overall Satisfaction", "Booking Experience", "Doctor Quality"],
          bottom: "0%",
          itemGap: 24,
          itemWidth: 12,
          itemHeight: 12,
          textStyle: {
            color: "#666",
            fontSize: 13,
            padding: [0, 4],
          },
          icon: "circle",
        },
      };
      chart.setOption(option);
    }
    window.addEventListener("load", initSatisfactionChart);
    window.addEventListener("resize", () => {
      const chart = echarts.getInstanceByDom(
        document.getElementById("satisfactionChart"),
      );
      if (chart) {
        chart.resize();
      }
    });

    document.addEventListener('DOMContentLoaded', function() {
      const slides = document.querySelectorAll('.carousel-slide');
      const indicators = document.querySelectorAll('.indicator');
      const prevBtn = document.querySelector('.carousel-control.prev');
      const nextBtn = document.querySelector('.carousel-control.next');
      let currentSlide = 0;
      
      function showSlide(index) {
        slides.forEach(slide => {
          slide.classList.remove('active');
        });
        
        indicators.forEach(indicator => {
          indicator.classList.remove('active');
        });
        
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
        currentSlide = index;
      }
      
      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          let newIndex = currentSlide - 1;
          if (newIndex < 0) newIndex = slides.length - 1;
          showSlide(newIndex);
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          let newIndex = currentSlide + 1;
          if (newIndex >= slides.length) newIndex = 0;
          showSlide(newIndex);
        });
      }
      
      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', function() {
          showSlide(index);
        });
      });
      
      // Auto slide every 5 seconds
      setInterval(function() {
        let newIndex = currentSlide + 1;
        if (newIndex >= slides.length) newIndex = 0;
        showSlide(newIndex);
      }, 5000);
    });
    
    function showBookingModal() {
      // Implement booking modal functionality
      console.log('Booking modal opened');
    }
    
    function showServicesModal() {
      // Implement services modal functionality
      console.log('Services modal opened');
    }